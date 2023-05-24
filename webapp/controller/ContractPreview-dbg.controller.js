/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/model/formatter",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/ServiceManager",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/MessageStrip"
	// "jquery/sap/resources"
], function (BaseController, JSONModel, History, formatter, ServiceManager, Filter, FilterOperator, MessageStrip) {
	"use strict";
	var oMessageTemplate = new sap.m.MessagePopoverItem({
		type: "{state}",
		title: "{name}",
		// subtitle: '{name}'
		counter: "{aMessages.length}"
			// link: oLink
			//
	});

	var oMessagePopover = new sap.m.MessagePopover("idPopover", {
		items: {
			path: '/',
			template: oMessageTemplate
		}
	});

	return BaseController.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.ContractPreview", {

		formatter: formatter,
		ServiceManager: ServiceManager,

		onInit: function () {
			this.sDate = 0;
			this.eDate = 0;
			this.getRouter().getRoute("ContractPreview").attachPatternMatched(
				jQuery.proxy(function (evt) {
					var sName = evt.getParameter("name");
					this.oApplicationModel = this.getModel();
					if (sName === "ContractPreview") {
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
						this.oRouter = oRouter;
						//this.CtrDraftRootGuid = evt.getParameter("arguments").CtrRootGuid;
						this.byId('idCtrSubmit').setEnabled(true);
						this.getView().byId("idMessageStrip").setVisible(false);
						//this.oApplicationModel.refresh();
						//To improve performance
						this.is_initial_load = true;
						this.sDate = 0;
						this.eDate = 0;
						if (this.is_initial_load === true) {
							this.byId('idCtrTabContainer').getBinding("items").refresh();
						}
						this.refreshContractDrafts(); //for message strip
						//to clear message popover content
						oMessagePopover.destroyItems();
						this.byId('idBCtrMsgPopover').setText('');
						this.negativeQuantity = false;
					}
				}), this);
			if (!jQuery.support.touch) {
				this.getView().addStyleClass("sapUiSizeCompact");
			}
		},
		onAfterRendering: function () {
			this.byId('ContractsPreview').setShowHeader(false);
		},
		comboFill: function (oControlEvent) {
			oControlEvent.getSource().getBinding("items").resume();
		},
		refreshContractDrafts: function (data, response) {
			var oModelDrafts = this.oApplicationModel;
			var mParameters = {
				urlParameters: {
					"$expand": "to_PurContrItmDrftForMngPurReqn"
				},
				success: jQuery.proxy(this.onSuccessCtrDraftRead, this),
				error: jQuery.proxy(this.onErrorRequest,
					this)
			};
			oModelDrafts.read("/C_PurContrDrftForMngPurReqn", mParameters);

			//Message Handling Code changes for update
			this.byId('idCtrSubmit').setEnabled(true);
			if (response !== undefined) {
				if (response.headers['sap-message'] !== undefined) {
					this.checkFieldsCTRPreview();
					this.getView().rerender();
					sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
					var sMsgPopoverId = sIdTabContainer.replace('idTabCtrContainerItem', 'idBCtrMsgPopover');
					var oMsgPopover = this.byId(sMsgPopoverId);
					oMsgPopover.setVisible(true);
					var aMessages;

					aMessages = JSON.parse(response.headers['sap-message']).details;
					var aMessage = new Array();
					var aCompErrMessage = new Array();
					if (aMessages !== undefined) {
						if (aMessages.length > 0) {
							for (var i = 0; i < aMessages.length; i++) {
								aCompErrMessage = {
									name: JSON.parse(response.headers['sap-message']).details[i].message,
									state: this._getMessageState(JSON.parse(response.headers['sap-message'])
										.details[
											i].severity),
									icon: this._getMessageIcon(JSON.parse(response.headers['sap-message'])
										.details[
											i].severity)
								};
								aMessage.push(aCompErrMessage);
							}
							if (JSON.parse(response.headers['sap-message']).code !== 'APPL_MM_PR/004') {
								aCompErrMessage = {
									name: JSON.parse(response.headers['sap-message']).message,
									state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
									icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
								};
								aMessage.push(aCompErrMessage);
							}
						} else if ((JSON.parse(response.headers['sap-message']).code !== 'APPL_MM_PR/004') && (JSON.parse(response.headers['sap-message'])
								.message !== '')) {
							aCompErrMessage = {
								name: JSON.parse(response.headers['sap-message']).message,
								state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
								icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
							};
							aMessage.push(aCompErrMessage);
						} else {
							this._getMessagePopover(aMessage).close();
							//oMsgPopover.setVisible(false);
							var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
							var sMsgStripId = sIdTabContainer.replace('idTabCtrContainerItem', 'idMessageStrip');
							var oMsgStrip = this.byId(sMsgStripId);
							oMsgStrip.setVisible(false);
						}
						oMessagePopover = this._getMessagePopover(aMessage);
					}
				}
			}
		},
		onErrorUpdate: function () {},
		onSuccessCtrTypeRead: function (data, response) {
			this.oCTRTypes = data.results;
		},

		onErrorRequest: function (err) {},

		onSuccessCtrDraftRead: function (oResponse, oData) {
			var oCtrData = oData.data;
			if (!this.oldData) {
				this.oldData = oData.data;
			}
			if (oCtrData) {
				var oCtrBatchData = oCtrData;
				if (oCtrBatchData.results.length === 0) {
					// this.byId('ContractsPreview').destroy(); //commented due to view not found error while navigating the second time
					this.onNavBack();
					// window.history.go(-1);
				}
				if (this.oldData.results.length !== oCtrBatchData.results.length) { //not refreshing in case of deleting single lineitem when many lineitems exist in the same draft
					this.oldData = oData.data;
					if (this.is_initial_load === false) { // for avoiding multiple refresh at the time of Create_ctr_draft
						this.byId('idCtrTabContainer').getBinding("items").refresh();
					}
				}
				if (oCtrData.results.length === 1) {
					this.byId('idCtrTabContainer').getAggregation('_tabStrip').setProperty('visible', false);
				} else if (oCtrData.results.length > 1) {
					this.byId('idCtrTabContainer').getAggregation('_tabStrip').setProperty('visible', true);
				}
			} else if (!oCtrData) {
				if (oCtrData.results.length === 0) {
					this.onNavBack();
				}
			}
			this.is_initial_load = false;
		},

		checkFieldsCTRPreview: function () {
			var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
			var sCbCtrTypeId = sIdTabContainer.replace('idTabCtrContainerItem', 'idCtrTypes');
			var oCbCtrTYpe = this.byId(sCbCtrTypeId);
			if (oCbCtrTYpe.getValue('value') === '') {
				oCbCtrTYpe.setValueState(sap.ui.core.ValueState.Error);
				oCbCtrTYpe.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errCtrType"));
			}
			var sTargetValId = sIdTabContainer.replace('idTabCtrContainerItem', 'idCtrTargetVal');
			var oCbTargetVal = this.byId(sTargetValId);
			if ((oCbCtrTYpe.getValue('value').indexOf('CWK') > 0 || oCbCtrTYpe.getValue('value').indexOf('WK') > 0) && (
					oCbTargetVal.getValue('value') ===
					"0.00" || oCbTargetVal.getValue('value') === "")) {
				oCbTargetVal.setValueState(sap.ui.core.ValueState.Error);

			}
			var sSupplierId = sIdTabContainer.replace('idTabCtrContainerItem', 'idSupplier');
			var oSupplier = this.byId(sSupplierId);
			if (oSupplier.getValue('value') === '') {
				oSupplier.setValueState(sap.ui.core.ValueState.Error);
				oSupplier.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errSupplier"));
			}
			var sPurGrpId = sIdTabContainer.replace('idTabCtrContainerItem', 'idPurchasingGroup');
			var oPurGrp = this.byId(sPurGrpId);
			if (oPurGrp.getValue('value') === '') {
				oPurGrp.setValueState(sap.ui.core.ValueState.Error);
				oPurGrp.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPGrp"));
			}
			var sPurOrgId = sIdTabContainer.replace('idTabCtrContainerItem', 'idPurchasingOrg');
			var oPurOrg = this.byId(sPurOrgId);
			if (oPurOrg.getValue('value') === '') {
				oPurOrg.setValueState(sap.ui.core.ValueState.Error);
				oPurOrg.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPOrg"));
			}
		},

		tabitemSelect: function (oEvent) {
			//To Clear the Message Pop Over Content
			oMessagePopover.destroyItems();
			var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
			if (sIdTabContainer != null || sIdTabContainer != undefined) {
				var sMsgPopoverId = sIdTabContainer.replace('idTabCtrContainerItem', 'idBCtrMsgPopover');
				var oMsgPopover = this.byId(sMsgPopoverId);
				oMsgPopover.setVisible(false);
			}
			this.negativeQuantity = false;
		},

		handleDelete: function (oEvent) {
			var oSelectedContext = oEvent.getParameter('listItem').getBindingContext();
			var vDraftItemId = oEvent.getSource().getModel().getProperty('PurchaseContractItemDraftUUID', oSelectedContext);
			var sDraftURL = "/C_PurContrItmDrftForMngPurReqn(PurchaseContractItemDraftUUID=guid'" + vDraftItemId + "')";
			var oModelDrafts = this.oApplicationModel;
			oModelDrafts.remove(sDraftURL, {
				success: jQuery.proxy(this.refreshContractDrafts, this)
			});
		},

		updateCtrDraft: function (oPayload, vSelectedDraftId) {
			var oModel = this.oApplicationModel;
			oModel.setRefreshAfterChange(false);
			var sCTRDraftUrl = "/C_PurContrDrftForMngPurReqn(guid'" + vSelectedDraftId + "')";
			var mParameters = new Object();
			mParameters.success = jQuery.proxy(this.refreshContractDrafts, this);
			mParameters.error = jQuery.proxy(this.onErrorUpdate, this);
			oModel.update(sCTRDraftUrl, oPayload, mParameters);
		},

		onChangeCtrType: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vCtrType = this.getView().getModel().getProperty('PurchasingDocumentType', oSelectedContext);
			var bChanged = this.changeValueState(oEvent.getSource(), vCtrType);
			this.onChangePayload(oEvent, vSelectedDraftId);
		},

		onChangeStartDate: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var dStartDate = oEvent.getSource().getDateValue();
			this.sDate = dStartDate;
			var dValEndDate = this.getView().getModel().getProperty('ValidityEndDate', oSelectedContext);
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var dCurrentDay = new Date();
			var oStartDate = new Date(dStartDate);
			var sErrText;
			if (this.eDate === "0") {
				this.eDate = dValEndDate;
			}
			if (dCurrentDay > dStartDate) {
				oEvent.getSource().setValueState("Error");
				sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errDateInPast");
				oEvent.getSource().setValueStateText(sErrText);
			} else if (dStartDate > this.eDate) {
				oEvent.getSource().setValueState("Error");
				sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity");
				oEvent.getSource().setValueStateText(sErrText);
			} else {
				if (this.getTestMode() === undefined || this.getTestMode() === false) {
					oEvent.getSource().setValueState("None");
					var vField = "ValStartDate";
					this.onChangePayload(oEvent, vSelectedDraftId, vField);
				}
			}
		},

		onChangeEndDate: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var dValEndDate = oEvent.getSource().getDateValue();
			this.eDate = dValEndDate;
			var dStartDate = this.getView().getModel().getProperty('ValidityStartDate', oSelectedContext);
			var dCurrentDay = new Date();
			var oEndDate = new Date(dValEndDate);
			var sErrText;
			if (this.sDate === "0") {
				this.sDate = dStartDate;
			}
			if (dCurrentDay > dValEndDate) {
				oEvent.getSource().setValueState("Error");
				sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errEndInPast");
				oEvent.getSource().setValueStateText(sErrText);
			} else if (this.sDate > dValEndDate) {
				oEvent.getSource().setValueState("Error");
				sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity");
				oEvent.getSource().setValueStateText(sErrText);
			} else {
				if (this.getTestMode() === undefined || this.getTestMode() === false) {
					oEvent.getSource().setValueState("None");
					var vField = "ValEndDate";
					this.onChangePayload(oEvent, vSelectedDraftId, vField);
				}
			}

		},

		onChangeTargetValue: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vTargetVal = this.getView().getModel().getProperty('PurchaseContractTargetAmount', oSelectedContext);
			this.changeValueState(oEvent.getSource(), vTargetVal);
			var number_to_array = vTargetVal.split(".");
			var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
			var sTargetValId = sIdTabContainer.replace('idTabCtrContainerItem', 'idCtrTargetVal');
			var oCbTargetVal = this.byId(sTargetValId);
			var sSaveId = sIdTabContainer.replace('idTabCtrContainerItem', 'idCtrSubmit');
			var oSave = this.byId(sSaveId);

			if (number_to_array[0].length > 13) {
				oCbTargetVal.setValueState(sap.ui.core.ValueState.Error);
				oCbTargetVal.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidTrgtVal"));
				oSave.setEnabled(false);
			} else {
				oSave.setEnabled(true);
			}
			if (number_to_array[1] !== undefined) {
				if (number_to_array[1].length > 3) {
					oCbTargetVal.setValueState(sap.ui.core.ValueState.Error);
					oCbTargetVal.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidTrgtVal"));
				}
			}
			if (oCbTargetVal.getValueState() !== "Error") {
				var bNotNegative = vTargetVal.indexOf("-");
				if (bNotNegative < 0) {
					if (this.getTestMode() === undefined || this.getTestMode() === false) {
						this.onChangePayload(oEvent, vSelectedDraftId);
					}
				} else {
					oCbTargetVal.setValueState(sap.ui.core.ValueState.Error);
					oCbTargetVal.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidTrgtVal"));
				}
			}
			if (vTargetVal === '' || vTargetVal === undefined) {
				//when the target value is empty and on save,gateway error is raised. Hence setting the field to 0.
				if (oCbTargetVal.getValue('value') === '' || oCbTargetVal.getValue('value') === undefined) {
					oCbTargetVal.setValue('0.00');
					oCbTargetVal.setValueState(sap.ui.core.ValueState.None);
				}
				if (this.getTestMode() === undefined || this.getTestMode() === false) {
					this.onChangePayload(oEvent, vSelectedDraftId);
				}
			}
		},

		onChangePurchasingGroup: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vPGrp;
			var bChanged = this.changeValueState(oEvent.getSource(), vPGrp);
			var vField = "PGrp";
			if (this.PGrpFromF4) {
				vPGrp = this.PGrpFromF4;
				oEvent.getSource().setValue(vPGrp);
			} else {
				vPGrp = oEvent.getParameter("value");
			}
			if (this.getTestMode() === undefined || this.getTestMode() === false) {
				this.onChangePayload(oEvent, vSelectedDraftId, vField, vPGrp);
			}
		},
		onChangePurchasingOrganization: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vPOrg;
			var bChanged = this.changeValueState(oEvent.getSource(), vPOrg);
			var vField = "POrg";
			if (this.POrgFromF4) {
				vPOrg = this.POrgFromF4;
				oEvent.getSource().setValue(vPOrg);
			} else {
				vPOrg = oEvent.getParameter("value");
			}
			if (this.getTestMode() === undefined || this.getTestMode() === false) {
				this.onChangePayload(oEvent, vSelectedDraftId, vField, vPOrg);
			}
		},
		onChangePayload: function (oEvent, vSelectedDraftId, vField, vPGrpPOrg) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vCtrType = this.getView().getModel().getProperty('PurchasingDocumentType', oSelectedContext);
			var vTargetVal = this.getView().getModel().getProperty('PurchaseContractTargetAmount', oSelectedContext);
			if (vTargetVal === '' || vTargetVal === undefined) {
				vTargetVal = "0.00";
			}
			var vSupplier = this.getView().getModel().getProperty('Supplier', oSelectedContext);
			if( this.sDate === 0 ){
 				this.sDate = this.getView().getModel().getProperty('ValidityStartDate', oSelectedContext);
			}
			if( this.eDate === 0 ){
 				this.eDate = this.getView().getModel().getProperty('ValidityEndDate', oSelectedContext);
			}			
			var dStartDate = this.sDate;
			var oStartDate = new Date(dStartDate);
			var dValEndDate = this.eDate;
			var oEndDate = new Date(dValEndDate);
			var vPOrg, vPGrp;
			//	var pStartDate, pEndDate;
			var iDraftSlNo = this.getView().getModel().getProperty('SerialNumber', oSelectedContext);
			this.vDraftSlNoForFieldEnable = iDraftSlNo;
			vPGrp = this.getView().getModel().getProperty('PurchasingGroup', oSelectedContext);
			vPOrg = this.getView().getModel().getProperty('PurchasingOrganization', oSelectedContext);
			// var oLocale = sap.ui.getCore().getConfiguration().getLocale();
			// // var oStartDate = new Date(dStartDate);
			// var utc = oStartDate.getTime() + (oStartDate.getTimezoneOffset() * 60000);
			// var offset = 0;
			// var edate = new Date(utc + (3600000 * offset));
			// var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			// 	pattern: "yyyy-MM-dd'T'HH:mm:ss"
			// }, oLocale);
			// var utc1 = oEndDate.getTime() + (oEndDate.getTimezoneOffset() * 60000);
			// var offset1 = 0;
			// var edate1 = new Date(utc1 + (3600000 * offset1));
			// 	var formatter1 = sap.ui.core.format.DateFormat.getDateTimeInstance({
			// 	pattern: "yyyy-MM-dd'T'HH:mm:ss"
			// }, oLocale);
			if (vField === "POrg") {
				this.bPOrgEditable = iDraftSlNo + "true";
				vPOrg = vPGrpPOrg;
				vPGrp = this.getView().getModel().getProperty('PurchasingGroup', oSelectedContext);
				this.changeValueState(oEvent.getSource(), vPOrg); //marking the Purchasing group field invalid if there is no value 
			} else if (vField === "PGrp") {
				this.bPGrpEditable = iDraftSlNo + "true";
				vPGrp = vPGrpPOrg;
				vPOrg = this.getView().getModel().getProperty('PurchasingOrganization', oSelectedContext);
				this.changeValueState(oEvent.getSource(), vPGrp); //marking the Purchasing Org field invalid if there is no value 
			}
			/*else if (vField === "ValEndDate") {
				oEndDate.setDate(dValEndDate.getDate() + 1);
			} else if (vField === "ValStartDate") {
				oStartDate.setDate(dStartDate.getDate() + 1);
			}*/
			oStartDate.setDate(dStartDate.getDate() + 1);
			oEndDate.setDate(dValEndDate.getDate() + 1);
			//to change the input date from IST to UTC format
			// var pStartDate = oDateFormat.format(edate);
			// var pEndDate = oDateFormat.format(edate1);
			// pStartDate = formatter1.format(oStartDate);
			// pEndDate = formatter1.format(oEndDate);
			if (vTargetVal === "") {
				vTargetVal = "0";
			}
			var oPayload = {
				'PurchaseContractDraftUUID': vSelectedDraftId,
				'PurchasingDocumentType': vCtrType,
				'Supplier': vSupplier,
				'ValidityStartDate': oStartDate,
				'ValidityEndDate': oEndDate,
				'PurchaseContractTargetAmount': vTargetVal,
				'PurchasingGroup': vPGrp,
				'PurchasingOrganization': vPOrg
			};
			this.updateCtrDraft(oPayload, vSelectedDraftId);
		},

		onChangeTargetQty: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractItemDraftUUID', oSelectedContext);
			var vTargetQty = this.getView().getModel().getProperty('TargetQuantity', oSelectedContext);
			if (vTargetQty === "") {
				vTargetQty = "0";
			}
			var bChanged = this.changeValueState(oEvent.getSource(), vTargetQty);
			var sErrText;
			this.negativeQuantity = false;
			var bNotNegative = vTargetQty.indexOf("-");
			var number_to_array = vTargetQty.split(".");
			var oPayload = {
				'PurchaseContractItemDraftUUID': vSelectedDraftId,
				'TargetQuantity': vTargetQty
			};
			var sCTRDraftUrl = "/C_PurContrItmDrftForMngPurReqn(PurchaseContractItemDraftUUID=guid'" + vSelectedDraftId + "')";
			var oModel = this.oApplicationModel;
			if ((number_to_array[0].length <= 10) && (bNotNegative < 0)) {
				if (((number_to_array[1] !== undefined) && (number_to_array[1].length <= 3)) || (number_to_array[1] === undefined)) {
					oModel.update(sCTRDraftUrl, oPayload, {
						success: jQuery.proxy(this.refreshContractDrafts, this),
						error: jQuery.proxy(this.onErrorUpdate, this)
					});
				} else {
					oEvent.getSource().setValueState("Error");
					sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errTrgtQty");
					oEvent.getSource().setValueStateText(sErrText);
				}
				this.negativeQuantity = false;
			} else {
				oEvent.getSource().setValueState("Error");
				sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errTrgtQty");
				oEvent.getSource().setValueStateText(sErrText);
				this.negativeQuantity = true;
			}
		},

		onChangeSupplier: function (oEvent) {
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vSupplier = this.getView().getModel().getProperty('Supplier', oSelectedContext);
			var bChanged = this.changeValueState(oEvent.getSource(), vSupplier);
			if (this.getTestMode() === undefined || this.getTestMode() === false) {
				this.onChangePayload(oEvent, vSelectedDraftId);
			}
		},

		changeValueState: function (oControl, vValue) {
			if (vValue) {
				oControl.setValueState("None");
				return "X";
			} else {
				oControl.setValueState("Error");
				return;
			}
		},
		tabitemCloseHandler: function (oEvent) {
			// prevent the tab being closed by default
			oEvent.preventDefault();
			var oBindingContext = oEvent.getParameter('item').getBindingContext();
			var oItemToClose = oEvent.getParameter('item');
			var vContractDraftUUID = oEvent.getSource().getModel().getProperty('PurchaseContractDraftUUID', oBindingContext);
			var that = this;
			var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('CtrTabItemClose');
			sap.m.MessageBox.confirm(msgText + " " + oItemToClose.getName() + "?", {
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						var deleteDraftURL = "/C_PurContrDrftForMngPurReqn(PurchaseContractDraftUUID=guid'" + vContractDraftUUID + "')";
						var oModelDrafts = that.oApplicationModel;
						//oModelDrafts.setRefreshAfterChange(true);
						//To improve performance
						that.byId('idCtrTabContainer').getBinding("items").refresh();
						var mParams = {};
						mParams.success = jQuery.proxy(that.successDraftDelete, that);
						mParams.error = jQuery.proxy(that.fnErrorCtrHeaderDiscard, that);
						oModelDrafts.remove(deleteDraftURL, mParams);
					}
				}
			});
		},

		fnContractDiscard: function (oEvent) {
			// create popover
			var vContractDraftTab;
			this.vContractDraftUUID = oEvent.getSource().getBindingContext().getProperty('PurchaseContractDraftUUID');
			if (this.getTestMode() === true) {
				vContractDraftTab = 1;
			} else {
				vContractDraftTab = parseInt(oEvent.getSource().getParent().getId().charAt(oEvent.getSource().getParent().getId().length - 1)) + 1;
			}
			var vCtrDraftTab = parseInt(oEvent.getSource().getParent().getId().charAt(oEvent.getSource().getParent().getId().length - 1)) + 1;
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.discardCtr", this);
				this.getView().addDependent(this._oPopover);
			}

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oPopover.openBy(oButton);
			});
			var discardCtrtext = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardCtrDraftmsg');
			sap.ui.getCore().byId("discardCtrtext").setText(discardCtrtext + vCtrDraftTab + "?");

		},
		handleCtrDiscardPress: function (oEvent) {
			var vContractDraftUUID = this.vContractDraftUUID.trim();
			var deleteDraftURL = "/C_PurContrDrftForMngPurReqn(PurchaseContractDraftUUID=guid'" + vContractDraftUUID + "')";
			var oModelDrafts = this.oApplicationModel;
			//oModelDrafts.setRefreshAfterChange(true);
			var mParams = {};
			mParams.success = jQuery.proxy(this.successDraftDelete, this);
			mParams.error = jQuery.proxy(this.fnErrorCtrHeaderDiscard, this);
			oModelDrafts.remove(deleteDraftURL, mParams);
			if (this.getTestMode() === true) {
				window.history.go(-1);
				return;
			}
		},
		successDraftDelete: function () {
			//function for success
			if (this._oPopover) {
				this._oPopover.close();
				var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardDiscardSuccess');
				sap.m.MessageToast.show(msgText);
			}
			//To navigate back to worklist page
			//	this.onNavBack1();
			this.refreshContractDrafts();
			//To improve performance
			this.byId('idCtrTabContainer').getBinding("items").refresh();
		},
		// onNavBack1: function (evt) {
		// 	this.oRouter.navTo("worklist", {}, true);
		// },
		fnErrorCtrHeaderDiscard: function (data, response) {
			this._oPopover.close();
			//var msgText = "Error while discarding";
			var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardDiscardFailure');
			sap.m.MessageToast.show(msgText, {
				duration: 3000
			});
		},
		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy(true);
			}
		},

		onNavBack: function (evt) {
			this.byId('idCtrSubmit').setEnabled(false);
			//	window.history.go(-1);
			//	this.oApplicationModel.refresh();
			this.oRouter.navTo("worklist");
		},
		handleContractSubmit: function (oEvent) {
			var aBatchPostCreateContract = [];
			this.byId('idCtrSubmit').setEnabled(false);
			var oDataModel = this.oApplicationModel;
			var oSelectedContext = oEvent.getSource().getBindingContext();
			var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vPurContract = this.getView().getModel().getProperty('PurchaseContract', oSelectedContext);
			this.PurCtr = vPurContract.replace(/^\D+/g, '');
			var draftId = vSelectedDraftId;
			var buisObj = 'CT';
			var payload = {};
			var controller = this;
			var dStartDate = this.sDate;
			var dValEndDate = this.eDate;
			//	var vSelectedDraftId = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var dCurrentDay = new Date();
			//var oStartDate = new Date(dStartDate);
			var sErrText;
			var aMessage = new Array();
			if (dStartDate) {
				if (dStartDate > dValEndDate) {
					var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
					var sMsgStripId = sIdTabContainer.replace('idTabCtrContainerItem', 'idMessageStrip');
					var oMsgStrip = this.byId(sMsgStripId);
					oMsgStrip.setVisible(true);
					sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity");
					this.byId('idCtrSubmit').setEnabled(true);
					var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
					var sMsgPopoverId = sIdTabContainer.replace('idTabCtrContainerItem', 'idBCtrMsgPopover');
					var oMsgPopover = this.byId(sMsgPopoverId);
					oMsgPopover.setVisible(true);
					var aCompErrMessage = {
						name: sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity"),
						state: this._getMessageState("error"),
						icon: this._getMessageIcon("error"),
					};
					aMessage.push(aCompErrMessage);
					oMessagePopover = this._getMessagePopover(aMessage);
					// oMessagePopover = this._getMessageState("error");
					// oMessagePopover = this._getMessageIcon("error");
					// aMessage.push(sErrText);
					this.getView().rerender();
					oMsgPopover.fireEvent("press");
					return;
				}
				// else {
				// 	//oEvent.getSource().setValueState("None");
				// 	var vField = "ValStartDate";
				// 	this.onChangePayload(oEvent, vSelectedDraftId, vField);
				// }
			}
			if (dValEndDate) {
				if (dStartDate > dValEndDate) {
					var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
					var sMsgStripId = sIdTabContainer.replace('idTabCtrContainerItem', 'idMessageStrip');
					var oMsgStrip = this.byId(sMsgStripId);
					oMsgStrip.setVisible(true);
					sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity");
					this.byId('idCtrSubmit').setEnabled(true);
					var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
					var sMsgPopoverId = sIdTabContainer.replace('idTabCtrContainerItem', 'idBCtrMsgPopover');
					var oMsgPopover = this.byId(sMsgPopoverId);
					oMsgPopover.setVisible(true);
					var aCompErrMessage = {
						name: sErrText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidity"),
						state: this._getMessageState("error"),
						icon: this._getMessageIcon("error"),
					};
					aMessage.push(aCompErrMessage);
					oMessagePopover = this._getMessagePopover(aMessage);
					// oMessagePopover = this._getMessageState("error");
					// oMessagePopover = this._getMessageIcon("error");
					// aMessage.push(sErrText);
					this.getView().rerender();
					oMsgPopover.fireEvent("press");
					return;
				}
				// else {
				// 	//oEvent.getSource().setValueState("None");
				// 	var vField = "ValEndDate";
				// 	this.onChangePayload(oEvent, vSelectedDraftId, vField);
				// }
			}
			if (this.getTestMode() === undefined || this.getTestMode() === false) {
				if (this.negativeQuantity != true) {
					ServiceManager.activateBO(draftId, buisObj, payload, controller);
				}
			} else {
				this.activateBoSuccess();
			}
			this.getView().rerender();
		},
		activateBoSuccess: function (data, response) {
			if (this.getTestMode() == true) {
				var successMessage = "Contract xxxxxxxx created";
				sap.m.MessageBox.success(successMessage, {
					styleClass: "sapUiSizeCompact",
					actions: [this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("OK")],
					onClose: function (oAction) {
						//Close the Message Box
					},
					initialFocus: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("OK")
				});
				return;
			}
			var iChangeRespCount = response.headers['sap-message'];
			var vPublishMsgCode = JSON.parse(response.headers['sap-message']).code;
			var iNoOfErrorMsgs = 0;
			var vNavFlag = true;
			var aMessage = new Array();
			var aCompErrMessage = new Array();
			var vFailedDraft;
			this.vNumberOfContracts = this.byId('idCtrTabContainer').getItems().length;
			var that = this;
			var bShowPopup = false;
			// if successful, show toast
			if (vPublishMsgCode == "ContractId/101") {
				//	this.getView().byId("idMessageStrip").setVisible(false);
				var vContractNumber = JSON.parse(response.headers['sap-message']).message;
				var sContract = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("Contract");
				var sCreatedSuccessfully = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("createdSuccessfully");
				var spaceDelimiter = " ";
				var sSuccessMsg = sContract + spaceDelimiter + vContractNumber + spaceDelimiter + sCreatedSuccessfully;
				sap.m.MessageBox.success(sSuccessMsg, {
					styleClass: "sapUiSizeCompact",
					actions: [that.getOwnerComponent().getModel('i18n').getResourceBundle().getText("OK")],
					onClose: function (oAction) {
						if (oAction === that.getOwnerComponent().getModel('i18n').getResourceBundle().getText("OK")) {
							if (that.vNumberOfContracts > 1) {
								//that.oApplicationModel.refresh();
								//To improve performance
								that.byId('idCtrTabContainer').getBinding("items").refresh();
							}
							//check if any more drafts exist
							that.refreshContractDrafts();
						}
					},
					initialFocus: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("OK")
				});
				bShowPopup = true;

			}

			//if failed, show message pop-up
			else {

				if (vPublishMsgCode == "FailedDraftId/101") {
					vFailedDraft = JSON.parse(response.headers['sap-message']).message;
				} else {
					vFailedDraft = JSON.parse(response.headers['sap-message']).details[0].message;
				}

				// read error msgs and push them to aMessage
				iNoOfErrorMsgs = JSON.parse(response.headers['sap-message']).details;

				for (var iMsgCount = 0; iMsgCount < iNoOfErrorMsgs.length; iMsgCount++) {

					var sMsgCode = JSON.parse(response.headers['sap-message']).details[
						iMsgCount].code;
					//if msg contains guid, do not display it
					if (sMsgCode == "FailedDraftId/101") {
						continue;
					}

					aCompErrMessage = {
						name: JSON.parse(response.headers['sap-message']).details[iMsgCount].message,
						state: this._getMessageState(JSON.parse(response.headers['sap-message'])
							.details[
								iMsgCount].severity),
						icon: this._getMessageIcon(JSON.parse(response.headers['sap-message'])
							.details[
								iMsgCount].severity)
					};
					aMessage.push(aCompErrMessage);
				}
				if (JSON.parse(response.headers['sap-message']).code != "FailedDraftId/101") {
					aCompErrMessage = {
						name: JSON.parse(response.headers['sap-message']).message,
						state: this._getMessageState(JSON.parse(response.headers['sap-message'])
							.severity),
						icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
					};
					aMessage.push(aCompErrMessage);
				}
				var vFirst = vFailedDraft.slice(0, 8);
				var vSecond = vFailedDraft.slice(8, 12);
				var vThird = vFailedDraft.slice(12, 16);
				var vFourth = vFailedDraft.slice(16, 20);
				var vLast = vFailedDraft.slice(20, 32);
				var vDelimiter = "-";
				this.vFailedGuid = "guid'" + vFirst + vDelimiter + vSecond + vDelimiter + vThird + vDelimiter + vFourth + vDelimiter + vLast + "'";
				this.vActivePurchaseContract = "%2523%2520%2520%2520%2520%2520%2520%2520" + this.PurCtr;
				/*	if (bShowPopup === true) {
						//var oMessagePopup = this._getMessagePopup(aMessage, vNavFlag, true);
						//	jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
						//	oMessagePopup.open();
					} else {
						oMessagePopover = this._getMessagePopover(aMessage);
					}*/
				//Check for empty fields
				this.checkFieldsCTRPreview();

				//Message Strip Code	
				var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
				var sMsgStripId = sIdTabContainer.replace('idTabCtrContainerItem', 'idMessageStrip');
				var oMsgStrip = this.byId(sMsgStripId);
				oMsgStrip.setVisible(true);

				//	this.getView().byId("idMessageStrip").setVisible(true);
				this.byId('idCtrSubmit').setEnabled(true);
				var sIdTabContainer = this.byId('idCtrTabContainer').getSelectedItem();
				var sMsgPopoverId = sIdTabContainer.replace('idTabCtrContainerItem', 'idBCtrMsgPopover');
				var oMsgPopover = this.byId(sMsgPopoverId);
				oMsgPopover.setVisible(true);
				oMessagePopover = this._getMessagePopover(aMessage);
				this.getView().rerender();
				oMsgPopover.fireEvent("press");
				//	oMessagePopover.openBy(oMsgPopover);

			}

		},
		errorCreateFOD: function (error) {},

		onNavToContract: function (oEvent) {
			/*if (this.getView().byId('idCtrTargetQty') != undefined) {
				this.getView().byId('idCtrTargetQty').destroy();
			}*/
			var oSelectedContext = oEvent.getSource().getBindingContext();
			this.vFailedGuid = this.getView().getModel().getProperty('PurchaseContractDraftUUID', oSelectedContext);
			var vPurContract = this.getView().getModel().getProperty('PurchaseContract', oSelectedContext);
			this.PurCtr = vPurContract.replace(/^\D+/g, '');
			this.vActivePurchaseContract = "%2523%2520%2520%2520%2520%2520%2520%2520" + this.PurCtr;
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "PurchaseContract",
					action: "manage"
				},
				params: {
					DraftUUID: this.vFailedGuid,
					PurchaseContract: decodeURIComponent(decodeURIComponent(this.vActivePurchaseContract)),
					IsActiveEntity: "false"
				}

			});
		},
		getGuid: function (str) {
			return str.slice(0, 8) + "-" + str.slice(8, 12) + "-" + str.slice(12, 16) +
				"-" + str.slice(16, 20) + "-" + str.slice(20, str.length + 1);
		},

		_getMessagePopover: function (aMessages) {

			var oModel = new JSONModel();
			oModel.setData(aMessages);

			var viewModel = new JSONModel();
			viewModel.setData({
				messagesLength: aMessages.length + ''
			});

			this.byId('idBCtrMsgPopover').setModel(viewModel);
			//            this.getView().setModel(viewModel);
			return oMessagePopover.setModel(oModel);
		},

		handleMessagePopoverPress: function (oEvent) {
			oMessagePopover.openBy(oEvent.getSource());
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

		_getMessagePopup: function (aMessages) {

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

			// var oWindow = this.oRouter;
			// var oDataModel = this.oApplicationFacade.getODataModel();

			this.vNumberofMessages = data.messages.length;
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(data);
			oTable.setModel(oModel);
			oTable.bindAggregation("items", "/messages", template);
			this.oMessageDialog = new sap.m.Dialog({

				content: [
					oTable,

				],
				buttons: [
					new sap.m.Button({
						text: "{i18n>ManagePurchaseContracts}",
						tap: jQuery.proxy(function (e) {
							//Navigate to Manage Purchase Contracts app
							oCrossAppNavigator.toExternal({

								target: {
									semanticObject: "PurchaseContract",
									action: "manage"
								},

								params: {
									DraftUUID: this.vFailedGuid,
									PurchaseContract: this.vActivePurchaseContract,
									IsActiveEntity: "false"
								}

							});
							this.oMessageDialog.close();
						}, this)

					}),
					new sap.m.Button({
						text: "{i18n>Close}",
						tap: jQuery.proxy(function (e) {
							this.oMessageDialog.close();
							this.refreshContractDrafts();
						}, this)

					})
				],
				state: "None",
				contentWidth: "25rem"
			});
			//				}

			this.oMessageDialog.setTitle("{i18n>MSG}" + ' (' + this.vNumberofMessages + ')');
			this.getView().addDependent(this.oMessageDialog);

			this.oMessageDialog.addStyleClass("sapUiSizeCompact");

			return this.oMessageDialog;

		},

		handleNavToPRFactsheet: function (oEvent) {
			/*	if (this.getView().byId('idCtrTargetQty') != undefined) {
					this.getView().byId('idCtrTargetQty').destroy();
				}*/
			var vSelectedPR = oEvent.getSource().getBindingContext().getObject().PurchaseRequisition;
			var vSelectedPRItem = oEvent.getSource().getBindingContext().getObject().PurchaseRequisitionItem;
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "PurchaseRequisition",
					action: "maintain"
				},
				params: {
					PurchaseRequisition: vSelectedPR,
					PurchaseRequisitionItem: vSelectedPRItem
				}
			});
		},

		handleNavToFactSheet: function (oEvent) {
			/*if (this.getView().byId('idCtrTargetQty') != undefined) {
				this.getView().byId('idCtrTargetQty').destroy();
			}*/
			var sMaterial = oEvent.getSource().getBindingContext().getObject().Material;
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "Material",
					action: "displayFactSheet"
				},
				params: {
					Material: sMaterial
				}
			});
		}
	});
});