/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/MessageStrip"
	// "jquery/sap/resources"
], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageStrip) {
	"use strict";
	var oMessageTemplate = new sap.m.MessagePopoverItem({
		type: "{state}",
		title: "{name}",
		counter: "{aMessages.length}"
	});
	var oMessagePopover = new sap.m.MessagePopover({
		items: {
			path: '/',
			template: oMessageTemplate
		}
	});
	return BaseController.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.RFQPreview", {
		formatter: formatter,
		onInit: function () {
			this.selectedRFQDrafts = new Array();
			this.getRouter().getRoute("RFQPreview").attachPatternMatched(
				jQuery.proxy(function (evt) {
					var sName = evt.getParameter("name");
					if (sName === "RFQPreview") {
						this.oApplicationModel = this.getModel();
						this.vRFQDraftId = evt.getParameter('arguments').RFQid;
						this.sRFQDraftUrl = "/C_RFQDraftForManagePurReqn(RFQDraftUUID=guid'" + this.vRFQDraftId + "')";
						this.refreshRFQdrafts();
						//Clear the date field , if the user has entered junk value.. update will not be called and the value will be persisted in the model for the next scenario.
						if (this.byId("idRFQSubmission").getValue()) {
							this.byId("idRFQSubmission").setValue('');
						}
					}
				}), this);
		},
		refreshRFQdrafts: function (data, response) {
			this.vActiveRFQNumber = null;	//3087778
			var oModelDrafts = this.oApplicationModel;
			var mParameters = {
				urlParameters: {
					"$expand": "to_RFQItemDraftForManagePurReqn,to_RFQBidderDraftForMngPurReqn"
				},
				success: jQuery.proxy(this.onSuccessRFQDraftRead, this),
				error: jQuery.proxy(this.onErrorRequest,
					this)
			};
			oModelDrafts.read(this.sRFQDraftUrl, mParameters);
		},
		comboFill: function (oControlEvent) {
			oControlEvent.getSource().getBinding("items").resume();
		},
		onSuccessRFQDraftRead: function (oResponse, oData) {
			this.byId("RFQObjectPageLayout").bindElement(this.sRFQDraftUrl);
			var oRFQData = oData.data;
			if (!this.oldData) {
				this.oldData = oData.data;
			}
			if (!oRFQData) {
				this.onNavBack();
			}
		},
		onErrorRequest: function (oResponse, oData) {
			this.onNavBack();
		},
		onRFQTypeChange: function (oEvent) {
			/*	var selectedRFQTypeKey = oEvent.getSource().getProperty('selectedKey', oEvent.getSource().getBindingContext());
				if (selectedRFQTypeKey == "") {
					oEvent.getSource().setValueState("Error");
					//this.byId('idButPOSubmit').setEnabled(false);
				} else {
					oEvent.getSource().setValueState("None");
				}*/
		},
		onChangeRFQDraft: function (oEvent) {
			var oDataModel = this.oApplicationModel;
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vPurgOrg = this.getView().getModel().getProperty('PurchasingOrganization', oSelectedContext);
			var vCompanyCode = this.getView().getModel().getProperty('CompanyCode', oSelectedContext);
			var vRFQDraftUUID = this.getView().getModel().getProperty('RFQDraftUUID', oSelectedContext);
			var vRFQDescription = this.getView().getModel().getProperty('RequestForQuotationName', oSelectedContext);
			var vRFQType = this.getView().getModel().getProperty('PurchasingDocumentType', oSelectedContext);
			var vRFQSubmission = this.getView().byId("idRFQSubmission").getDateValue();
			var vCurrentDay = new Date(); 
			var oSubmissionDate;
			if (vRFQSubmission !== null){
			oSubmissionDate = new Date(vRFQSubmission);
			}else
			{
				oSubmissionDate = null;	
			}
			//If date is invalid then rassie error mesaage	
			if (oEvent.getSource().getId() === this.byId("idRFQSubmission").getId()) {
				if (!oEvent.getParameter("valid")) {
					vRFQSubmission = null;
					this.byId("idRFQSubmission").setValue('');
				}
			}

			if (vRFQSubmission === null) {
				this.getView().byId("idRFQSubmission").setValueState("Error");
			} else {
				// 	if (vCurrentDay.getDate() == oSubmissionDate.getDate() || vCurrentDay < oSubmissionDate) {
				oSubmissionDate.setDate(vRFQSubmission.getDate() + 1);
				// 	} else {
				// 	//	this.getView().byId("idRFQSubmission").setValueState("Error");
				// 	}
				this.getView().byId("idRFQSubmission").setValueState("None");
			}
			if (vRFQType === "") {
				this.getView().byId("idRFQTypes").setValueState("Error");
				// bIsChanged = false;
			} else {
				this.getView().byId("idRFQTypes").setValueState("None");
			}
			// if (vRFQSubmission == null) {
			// 	var oPayload = {
			// 		'RFQDraftUUID': vRFQDraftUUID,
			// 		// 'Quotationearliestsubmsndate': oStartDate,
			// 		//'QuotationLatestSubmissionDate': oSubmissionDate,
			// 		'RequestForQuotationName': vRFQDescription,
			// 		'PurchasingDocumentType': vRFQType,
			// 		'PurchasingOrganization': vPurgOrg,
			// 		'CompanyCode': vCompanyCode
			// 	};
			// } else {
				var oPayload = {
					'RFQDraftUUID': vRFQDraftUUID,
					// 'Quotationearliestsubmsndate': oStartDate,
					'QuotationLatestSubmissionDate': oSubmissionDate,
					'RequestForQuotationName': vRFQDescription,
					'PurchasingDocumentType': vRFQType,
					'PurchasingOrganization': vPurgOrg,
					'CompanyCode': vCompanyCode
				};
			// }

			var mParameters = new Object();
			mParameters.success = jQuery.proxy(this.oSuccessUpdate, this);
			mParameters.error = jQuery.proxy(this.onErrorUpdate, this);
			oDataModel.update(this.sRFQDraftUrl, oPayload, mParameters);
		},
		oSuccessUpdate: function (data, response) {
			if (JSON.parse(response.headers['sap-message']).severity == 'warning' ||
				JSON.parse(response.headers['sap-message']).severity == 'error') {
				//open message pop
			}
			var iMsgCount = 0;
			if (response.headers['sap-message'] == undefined)
				response = response.data.__batchResponses[0].__changeResponses[0];
			var aMessages = JSON.parse(response.headers['sap-message']).details;
			var iNoOfErrorMsgs = 0;
			var aCompErrMessage = new Array();
			var oCompErrMessage = {
				name: JSON.parse(response.headers['sap-message']).message,
				state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
				icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
			};
			if (JSON.parse(response.headers['sap-message']).severity == 'warning' ||
				JSON.parse(response.headers['sap-message']).severity == 'error') {
				aCompErrMessage.push(oCompErrMessage);
				iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
			}
			for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
				var oCompErrMessage = {
					name: aMessages[iMsgCount].message,
					state: this._getMessageState(aMessages[iMsgCount].severity),
					icon: this._getMessageIcon(aMessages[iMsgCount].severity)
				};
				if ((aMessages[iMsgCount].severity == 'warning') || (aMessages[iMsgCount].severity == 'error')) {
					aCompErrMessage.push(oCompErrMessage);
					iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
				}
			}
			if (iNoOfErrorMsgs > 0) {
				this.byId('idRFQMsgPopover').setVisible(true);
				this.oMessagePopover = this._getMessagePopover(aCompErrMessage);
			} else {
				this.byId('idRFQMsgPopover').setVisible(false);
			}
			this.refreshRFQdrafts();
		},
		onPressAddBidder: function (oEvent) {
			if (!this.bidderFragment) {
				this.bidderFragment = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.BidderDialog",
					this // associate controller with the fragment
				);
				this.getView().addDependent(this.bidderFragment);
				this.bidderFragment.setRememberSelections(false);
			}
			// var aSmartFilters = oEvent.getParameter("bindingParams").filters[0].aFilters;
			var aSearchFilters = [];
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vPurgOrg = this.getView().getModel().getProperty('PurchasingOrganization', oSelectedContext);
			var vCompanyCode = this.getView().getModel().getProperty('CompanyCode', oSelectedContext);
			aSearchFilters.push(new sap.ui.model.Filter("PurchasingOrganization", "EQ", vPurgOrg));
			aSearchFilters.push(new sap.ui.model.Filter("CompanyCode", "EQ", vCompanyCode));
			this.bidderFragment.getBinding("items").filter(aSearchFilters, "Application");
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.bidderFragment);
			this.bidderFragment.open();
		},
		bidderclose: function (oEvent) {
			//	this.bidderFragment.getBinding("items").filter([], "Application");
		},

		onSearchBidder: function (oEvent) {
			// add filter for search in SoS fragment
			var aFilters = [];
			var sQuery = oEvent.getParameter('value');
			sQuery.replace("*", "");
			if (sQuery && sQuery.length > 0) {
				var vSupplier = new sap.ui.model.Filter("Supplier",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vsuppliername = new sap.ui.model.Filter("SupplierName",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vAddressId = new sap.ui.model.Filter("AddressID",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vcityname = new sap.ui.model.Filter("CityName",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vcountry = new sap.ui.model.Filter("CountryName",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vpostalcode = new sap.ui.model.Filter("PostalCode",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vPhone = new sap.ui.model.Filter("PhoneNumber",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var vemail = new sap.ui.model.Filter("EmailAddress",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				var filter = new sap.ui.model.Filter({
					filters: [vSupplier, vsuppliername, vAddressId, vcityname, vcountry, vpostalcode, vPhone, vemail],
					and: false
				});
				aFilters.push(filter);
			}
			// update list binding
			var list = sap.ui.getCore().byId("idBidderList");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		onPressOkBidder: function (oEvent) {
			var aSelectedContexts = oEvent.getParameter("selectedContexts");
			var bCompErrMessage = new Array();
			if (aSelectedContexts.length) {
				var aBatchCreateBidder = [];
				var oDataModel = this.oApplicationModel;
				for (var i = 0; i < aSelectedContexts.length; i++) {
					var vBidderId = oEvent.getParameter("selectedContexts")[i].getObject().Supplier;
					var sUrl = "/AddRFQBidders";
					var oPayload = {
						'Draftid': this.vRFQDraftId,
						'Supplier': vBidderId
					};
					oDataModel.callFunction(sUrl, {
						method: "POST",
						urlParameters: oPayload,
						success: jQuery.proxy(this.successBidderRefresh, this),
						error: jQuery.proxy(this.errorAddBidder, this)
					});
				}
				// oDataModel.submitChanges(jQuery.proxy(this.successBidderRefresh, this), jQuery.proxy(this.errorAddBidder, this), true);
			}
			this.bidderFragment.getBinding("items").filter([], "Application");
			//clearing message popup
			this._getMessagePopover(bCompErrMessage);

		},
		successBidderRefresh: function () {
			var sDraftUrl = "/C_RFQDraftForManagePurReqn(RFQDraftUUID=guid'" + this.vRFQDraftId + "')";
			var mParameters = {
				urlParameters: {
					"$expand": "to_RFQItemDraftForManagePurReqn,to_RFQBidderDraftForMngPurReqn"
				},
				success: jQuery.proxy(this.onSuccessRFQDraftRequest, this),
				error: jQuery.proxy(this.onErrorRFQDraftRequest,
					this)
			};
			this.oApplicationModel.read(sDraftUrl, mParameters);
		},
		handleBidderDelete: function (oEvent) {
			var sRFQBidderDraftUrl = oEvent.getParameter('listItem').getBindingContext().sPath;
			var oModelDrafts = this.oApplicationModel;
			oModelDrafts.remove(sRFQBidderDraftUrl, {
				success: jQuery.proxy(this.successBidderRefresh, this)
			});
		},

		handleRFQDelete: function (oEvent) {
			var sRFQItemDraftUrl = oEvent.getParameter('listItem').getBindingContext().sPath;
			var oModelDrafts = this.oApplicationModel;
			oModelDrafts.remove(sRFQItemDraftUrl, {
				success: jQuery.proxy(this.refreshRFQdrafts, this)
			});
		},
		onSuccessRFQDelete: function () { //function for RFQ delete success
			/*	var oModelDrafts = this.oApplicationFacade.getODataModel();
				this.vRFQDraftId = this.oApplicationFacade.oApplicationImplementation.getModel("selectedRFQDraftId");
				this.vRFQDraftId = this.vRFQDraftId.substr(0, 8) + '-' + this.vRFQDraftId.substr(8, 4) + '-' + this.vRFQDraftId.substr(12, 4) +
					'-' + this.vRFQDraftId.substr(
						16, 4) + '-' + this.vRFQDraftId.substr(20, 12);
				var oModelDrafts = this.oApplicationModel;
				var sDraftUrl = "/DraftRFQHeaderSet(Draftid=guid'" + this.vRFQDraftId + "')";
				var mParameters = {
					urlParameters: {
						"$expand": "DraftRFQHeaderItemNav,DraftRFQHeaderBidderNav"
					},
					success: jQuery.proxy(this.onSuccessRFQDraftRequest, this),
					error: jQuery.proxy(this.onErrorRFQDraftRequest,
						this)
				};
				oModelDrafts.read(sDraftUrl, mParameters);*/
		},
		fnRFQSave: function (oEvent) {
			var vRFQNumber = this.vActiveRFQNumber;
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			if (vRFQNumber !== undefined && vRFQNumber !== null) {
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "RequestForQuotation",
						action: "manage"
					},
					params: {
						RequestForQuotation: [vRFQNumber]
					}
				});
			} else {
				var aBatchPostCreateRFQ = [];
				var oDataModel = this.oApplicationModel;
				var sUrl = "/ActivateRFQ";
				var oPayload = {
					'Draftid': this.vRFQDraftId,
					'IsPublish': ''
				};
				oDataModel.callFunction(sUrl, {
					method: "POST",
					urlParameters: oPayload,
					success: jQuery.proxy(this.successSaveRFQ, this),
					error: jQuery.proxy(this.errorCreateRFQ, this)
				});
				// oDataModel.submitChanges(jQuery.proxy(this.successSaveRFQ, this), jQuery.proxy(this.errorCreateRFQ, this), true);
			}
		},
		fnRFQPublish: function () {
			var that = this;
			this.oResourceBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
			sap.m.MessageBox.show(this.oResourceBundle.getText("PublishMsg"), {
				icon: sap.m.MessageBox.Icon.CONFIRMATION,
				title: that.oResourceBundle.getText("PUBLISH"),
				actions: [that.oResourceBundle.getText("PUBLISH"), that.oResourceBundle.getText("Cancel")],
				onClose: function (oAction) {
					if (oAction === that.oResourceBundle.getText("PUBLISH")) {
						var aBatchPostCreateRFQ = [];
						var oDataModel = that.oApplicationModel;
						var sUrl = "/ActivateRFQ";
						var oPayload = {
							'Draftid': that.vRFQDraftId,
							'IsPublish': 'X'
						};
						oDataModel.callFunction(sUrl, {
							method: "POST",
							urlParameters: oPayload,
							success: jQuery.proxy(that.successPublishRFQ, that),
							error: jQuery.proxy(that.errorCreateRFQ, that)
						});
						// oDataModel.submitChanges(jQuery.proxy(that.successPublishRFQ, that), jQuery.proxy(that.errorCreateRFQ, that), true);
					}
				},
				initialFocus: that.oResourceBundle.getText("PUBLISH")
			});
		},

		successPublishRFQ: function (data, response) {
			// 			var iChangeRespCount = data.__batchResponses[0].__changeResponses.length;
			var vRfqNumber = JSON.parse(response.headers['sap-message']).message;
			var vPublishMsgCode = JSON.parse(response.headers['sap-message']).code;
			var iNoOfErrorMsgs = 0;
			var vNavFlag = true;
			var aMessage = new Array();
			var aCompErrMessage = new Array();
			if (vPublishMsgCode === "APPL_MM_PR/003") {
				var vRFQNo = JSON.parse(response.headers['sap-message']).details.message;
				//no need to set the model, making it a global variable
				this.vActiveRFQNumber = vRFQNo;
				// this.oApplicationFacade.oApplicationImplementation.setModel(vRFQNo, "RFQnumber");
				// sap.m.MessageToast.show(vRfqNumber, {
				// 	duration: 5000
				// });
				var oMessage = {
					name: vRFQNo,
					state: this._getMessageState(JSON.parse(response.headers['sap-message'])
						.severity),
					icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
				};
				var aMsg = new Array();
				aMsg.push(oMessage);
				this.byId('idRFQMsgPopover').setVisible(true);
				this.oMessagePopover = this._getMessagePopover();
			} else if (vPublishMsgCode === "APPL_MM_PR/001") {
				// sap.m.MessageToast.show(vRfqNumber, {
				// 	duration: 15000
				// });
				// jQuery.sap.delayedCall(2000, this, function () {
				// 	this.onNavBack();
				// });
				var that = this;
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				sap.m.MessageBox.success(
					vRfqNumber, {
						actions: [sap.m.MessageBox.Action.OK],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {
							jQuery.sap.delayedCall(2000, this, function () {
								that.onNavBack();
							});
						}
					}
				);
			}
			// else if (iChangeRespCount > 0) {
			else {
				var iMsgCount = 0;
				var aMessages = JSON.parse(response.headers['sap-message']).details;
				var oCompErrMessage = {
					name: JSON.parse(response.headers['sap-message']).message,
					state: this._getMessageState(JSON.parse(response.headers['sap-message'])
						.severity),
					icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
				};
				if (JSON.parse(response.headers['sap-message']).severity == 'warning' ||
					JSON.parse(response.headers['sap-message']).severity == 'error') {
					if ((JSON.parse(response.headers['sap-message']).code) == 'NO_NAV/100' &&
						(JSON.parse(response.headers['sap-message']).message) == 'S:NO_NAV:100')
						vNavFlag = false;
					else {
						aCompErrMessage.push(oCompErrMessage);
						iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
					}
				}
				for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
					var oCompErrMessage = {
						name: aMessages[iMsgCount].message,
						state: this._getMessageState(aMessages[iMsgCount].severity),
						icon: this._getMessageIcon(aMessages[iMsgCount].severity)
					};
					if ((aMessages[iMsgCount].severity == 'warning') || (aMessages[iMsgCount].severity == 'error')) {
						if ((aMessages[iMsgCount].code == 'NO_NAV/100') && (aMessages[iMsgCount].message == 'S:NO_NAV:100')) {
							vNavFlag = false;
						} else {
							aCompErrMessage.push(oCompErrMessage);
							iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
						}
					}
				}
				var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag, true);
				if (iNoOfErrorMsgs > 0) {
					this.byId('idRFQMsgPopover').setVisible(true);
					this.oMessagePopover = this._getMessagePopover(aCompErrMessage);
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				} else {
					this.byId('idRFQMsgPopover').setVisible(false);
				}
			}
		},
		successSaveRFQ: function (data, response) {
			var iChangeRespCount = JSON.parse(response.headers['sap-message']).details.length;
			var iMsgSeverity = JSON.parse(response.headers['sap-message']).severity;
			var vSuccessCode = JSON.parse(response.headers['sap-message']).code;
			var vCompErrMessage;
			if (this.vActiveRFQNumber) {
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "RequestForQuotation",
						action: "manage"
					},
					params: {
						Requestforquotation: [this.vActiveRFQNumber]
					}
				});
			}
			if (vSuccessCode == "RFQId/101") {
				vCompErrMessage = JSON.parse(response.headers['sap-message']).message;
				this.vActiveRFQNumber = vCompErrMessage;
			}
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			var iNoOfErrorMsgs = 0;
			var vNavFlag = true;
			if (iChangeRespCount > 0 || iMsgSeverity === "error") {
				var iMsgCount = 0;
				var aMessages = JSON.parse(response.headers['sap-message']).details;
				var aCompErrMessage = new Array();
				var oCompErrMessage = {
					name: JSON.parse(response.headers['sap-message']).message,
					state: this._getMessageState(JSON.parse(response.headers['sap-message'])
						.severity),
					icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
				};
				if (JSON.parse(response.headers['sap-message']).severity == 'warning' ||
					JSON.parse(response.headers['sap-message']).severity == 'error') {
					if ((JSON.parse(response.headers['sap-message']).code) == 'NO_NAV/100' &&
						(JSON.parse(response.headers['sap-message']).message) == 'S:NO_NAV:100')
						vNavFlag = false;
					else {
						aCompErrMessage.push(oCompErrMessage);
						iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
					}
				}
				for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
					var oCompErrMessage = {
						name: aMessages[iMsgCount].message,
						state: this._getMessageState(aMessages[iMsgCount].severity),
						icon: this._getMessageIcon(aMessages[iMsgCount].severity)
					};
					if ((aMessages[iMsgCount].severity == 'warning') || (aMessages[iMsgCount].severity == 'error')) {
						if ((aMessages[iMsgCount].code == 'NO_NAV/100') && (aMessages[iMsgCount].message == 'S:NO_NAV:100')) {
							vNavFlag = false;
						} else {
							aCompErrMessage.push(oCompErrMessage);
							iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
						}
					}
				}
				var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag);
				if (iNoOfErrorMsgs > 0) {
					this.byId("idMessageStrip").setVisible(true);
					this.byId('idRFQMsgPopover').setVisible(true);
					this.oMessagePopover = this._getMessagePopover(aCompErrMessage);
				} else {
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "RequestForQuotation",
							action: "manage"
						},
						params: {
							RequestForQuotation: [this.vActiveRFQNumber]
						}
					});
				}
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "RequestForQuotation",
						action: "manage"
					},
					params: {
						RequestForQuotation: [this.vActiveRFQNumber]
					}
				});
			}
		},

		_getMessageState: function (severity) {
			switch (severity) {
			case 'error':
				return sap.ui.core.ValueState.Error;
				break;
			case 'warning':
				return sap.ui.core.ValueState.Warning;
				break;
			case 'success':
				return sap.ui.core.ValueState.Success;
				break;
			case 'info':
				return sap.ui.core.ValueState.Success;
				break;
			}
		},
		_getMessageIcon: function (severity) {
			switch (severity) {
			case 'error':
				return "sap-icon://error";
				break;
			case 'warning':
				return "sap-icon://notification";
				break;
			case 'success':
				return "sap-icon://sys-enter";
				break;
			case 'info':
				return "sap-icon://sys-enter";
				break;
			}
		},
		_getMessagePopup: function (aMessages, vNavFlag, bIsPublish) {
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			var data = {
				"messages": aMessages
			};
			var oTable = new sap.m.Table({
				growing: true,
				inset: false,
				fixedLayout: false,
				backgroundDesign: sap.m.BackgroundDesign.Transparent,
				showSeparators: "Inner",
				columns: [
					new sap.m.Column({
						width: "25rem",
						styleClass: "name",
						hAlign: "Left",
						vAlign: "Top",
					})
				]
			});
			var template = new sap.m.ColumnListItem({
				unread: false,
				vAlign: "Top",
				cells: [
					new sap.ui.layout.Grid({
						vSpacing: 0,
						hSpacing: 1,
						content: [
							new sap.m.ObjectStatus({
								icon: "{icon}",
								state: "{state}",
								layoutData: new sap.ui.layout.GridData({
									span: "L2 M2 S2"
								})
							}),
							new sap.m.Text({
								text: "{name}",
								layoutData: new sap.ui.layout.GridData({
									span: "L10 M10 S10"
								})
							})
						]
					})
				]
			});
			var oWindow = this.oRouter;
			var oDataModel = this.oApplicationModel;
			this.vNumberofMessages = data.messages.length;
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(data);
			oTable.setModel(oModel);
			oTable.bindAggregation("items", "/messages", template);
			this.oMessageDialog = new sap.m.Dialog({
				content: [
					oTable
				],
				buttons: [
					new sap.m.Button({
						text: "{i18n>OK}",
						tap: jQuery.proxy(function (e) {
							this.oMessageDialog.close();
							if (bIsPublish == true) {
								jQuery.sap.delayedCall(2000, this, function () {
									this.onNavBack();
								});
							} else {
								//        
							}
							//            this.oRouter.navTo("RFQPreview");
						}, this),
					}),
				],
				state: "None",
				contentWidth: "25rem"
			});
			//                                                            
			var msgtext = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("MSG");
			this.oMessageDialog.setTitle(msgtext + ' (' + this.vNumberofMessages + ')');
			this.getView().addDependent(this.oMessageDialog);
			this.oMessageDialog.addStyleClass("sapUiSizeCompact");
			return this.oMessageDialog;
		},
		handleNav: function (oEvent) {
			var aSelectedItem = oEvent.getSource().getText().split("/");
			var vPRNo = aSelectedItem[0];
			var vPRItemNo = aSelectedItem[1];
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "PurchaseRequisition",
					action: "maintain"
				},
				params: {
					PurchaseRequisition: [vPRNo],
					PurchaseRequisitionItem: [vPRItemNo]
				}
			});
		},
		_removeArrayValue: function (aSelectedDrafts, draftId) {
			for (var aIndex = 0; aIndex < aSelectedDrafts.length; aIndex++) {
				if (aSelectedDrafts[aIndex].draftId == draftId) {
					aSelectedDrafts.splice(aIndex, 1);
				}
			}
		},
		onNavBack: function () {
			window.history.go(-1);
		},
		_getMessagePopover: function (aMessages) {

			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(aMessages);
			var viewModel = new sap.ui.model.json.JSONModel();
			viewModel.setData({
				'results.messagesLength': aMessages.length + ''
			});
			this.byId('idRFQMsgPopover').setModel(viewModel);
			return oMessagePopover.setModel(oModel);
		},
		handleMessagePopoverPress: function (oEvent) {
			if (this.getTestMode() === false) {
				this.oMessagePopover.openBy(oEvent.getSource());
			}
		},
		onPressEmailBidder: function (oEvent) {
			sap.m.URLHelper.triggerEmail(oEvent.getSource().getText());
		},
		onNavToRFQ: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vFailedGuid = this.getView().getModel().getProperty('RFQDraftUUID', oSelectedContext);
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "RequestForQuotation",
					action: "manage"
				},
				params: {
					RequestForQuotation: '',
					DraftUUID: vFailedGuid,
					IsActiveEntity: "false"
				}
			});
		}
	});
});