/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController",
	"sap/ui/core/routing/History",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/model/formatter",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/ServiceManager",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem"
	// "jquery/sap/resources"
], function (BaseController, History, formatter, ServiceManager, Filter, FilterOperator, MessagePopover, MessagePopoverItem) {
	"use strict";
	var oMessageTemplate = new sap.m.MessagePopoverItem({
		type: "{state}",
		title: "{name}",
		counter: "{aMessages.length}"
	});
	var numberOfTabs;
	var oMessagePopover = new sap.m.MessagePopover({
		items: {
			path: '/',
			template: oMessageTemplate
		}
	});
	return BaseController.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.PurchaseOrderPreview", {

		formatter: formatter,
		ServiceManager: ServiceManager,

		onInit: function () {
			this.getRouter().getRoute("PurchaseOrderPreview").attachPatternMatched(
				jQuery.proxy(function (evt) {
					var sName = evt.getParameter('name');
					this.oApplicationModel = this.getModel();
					if (sName === 'PurchaseOrderPreview') {
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
						this.oRouter = oRouter;
						this.is_initial_load = true;
						this.refreshPODrafts();
						if (this.is_initial_load === true)
							this.byId('idTabContainer').getBinding("items").refresh();
					}
				}, this), this);
			if (!jQuery.support.touch) {
				this.getView().addStyleClass("sapUiSizeCompact");
			}
		},
		onAfterRendering: function () {
			this.byId('PurchaseOrdersPreview').setShowHeader(false);
			//	this.byId('PurchaseOrdersPreview').setFloatingFooter(!this.byId('PurchaseOrdersPreview').getFloatingFooter());
		},

		refreshPODrafts: function () {
			var oModel = this.oApplicationModel;
			var mParameters = {
				urlParameters: {
					"$expand": "to_PurOrderItmDrftForMngPurReqn"
				},
				success: jQuery.proxy(this.successPODraft, this),
				error: jQuery.proxy(this.error,
					this)
			};
			oModel.read("/C_PurOrderDraftForMngPurReqn", mParameters);
			// oModel.submitChanges(jQuery.proxy(this.successPODraft, this), jQuery.proxy(this.errorCreateDraft, this), true);
			// oModel.refresh();
			////		this.byId('idTabContainer').getBinding("items").refresh(); //Removed coz screen getting refreshed on every PO change and making the field empty
		},

		successPODraft: function (data, response) {
			var oPOData = data;
			numberOfTabs = oPOData.results.length;
			if (!this.oldData) {
				this.oldData = data;
			}
			if (oPOData.results.length === 0) {
				// this.oRouter.navTo("worklist");
				this.onNavBack();
			} else
			if (this.oldData.results.length !== data.results.length) { //not refreshing in case of deleting single lineitem when many lineitems exist in the same draft
				this.oldData = data;
				if (this.is_initial_load === false) { // for avoiding multiple refresh at the time of Create_PO_draft
					// this.oApplicationModel.refresh();
					this.byId('idTabContainer').getBinding("items").refresh();
				}
			}
			this.is_initial_load = false;
		},

		error: function (err) {},
		
		comboFill: function (oControlEvent)
		{
			oControlEvent.getSource().getBinding("items").resume();
		},
		
		handleBusinessCard: function (oEvent) {
			this.idSourceVendorFgt = oEvent.getSource().getId();
			var vVendor = oEvent.getSource().getBindingContext().getObject().FixedSupplier;
			if (vVendor === "" || vVendor === undefined) {
				vVendor = oEvent.getSource().getBindingContext().getObject().Supplier;
			}
			var oModelVendor = this.getModel();
			var vURLVendor = "/VendorSet(Supplier='" + vVendor + "')";

			if (this._oPopover) {
				this._oPopover.destroy();
			}
			this._oPopover = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.BusinessCard", this);
			this.getView().addDependent(this._oPopover);

			var mParameters = {
				success: jQuery.proxy(this.BusinessCardData, this)
			};
			this.oApplicationModel.read(vURLVendor, mParameters);
			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oFixedVendorClick = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oPopover.openBy(oFixedVendorClick);
			});
		},
		BusinessCardData: function (data, response) {
			this._oPopover.setModel(new sap.ui.model.json.JSONModel(data));
			this._oPopover.setContentHeight('auto');
		},
		onCallAfterClose: function (oEvent) {
			this._oPopover.destroy();
		},

		//=====================DELETE/SAVE PO Draft=====================================================================
		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		},
		fnPopOverDiscard: function (oEvent) {
			var vPODraftTab;
			// create popover
			this.vPOPurchaseOrderDraftUUID = oEvent.getSource().getBindingContext().getProperty('PurchaseOrderDraftUUID');

			if (this.getTestMode() === true) {
				vPODraftTab = 1;
			} else {
				vPODraftTab = parseInt(oEvent.getSource().getParent().getId().charAt(oEvent.getSource().getParent().getId().length - 1)) + 1;
			}
			if (this._oPopover) {
				this._oPopover.destroy();
			}
			this._oPopover = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.discardPO", this);
			this.getView().addDependent(this._oPopover);

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oPopover.openBy(oButton);
			});
			var discardText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardDraftmsg');
			sap.ui.getCore().byId("discardtext").setText(discardText + vPODraftTab + "?");

		},
		handlePODiscardPress: function (oEvent) {
			var vPurchaseOrderDraftUUID = this.vPOPurchaseOrderDraftUUID.trim();
			var deleteDraftURL = "/C_PurOrderDraftForMngPurReqn(PurchaseOrderDraftUUID=guid'" + vPurchaseOrderDraftUUID + "')";
			var oModelDrafts = this.oApplicationModel;
			oModelDrafts.setRefreshAfterChange(false);
			var mParams = {};
			mParams.success = jQuery.proxy(this.successDraftDelete, this);
			mParams.error = jQuery.proxy(this.fnErrorPOHeaderDiscard, this);
			oModelDrafts.remove(deleteDraftURL, mParams);
			if (this.getTestMode() === true) {
				window.history.go(-1);
				return;
			}
		},

		fnErrorPOHeaderDiscard: function (data, response) {
			this._oPopover.close();
			//var msgText = "Error while discaridng";
			var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardDiscardFailure');
			sap.m.MessageToast.show(msgText, {
				duration: 3000
			});
		},

		tabitemCloseHandler: function (oEvent) {
			// prevent the tab being closed by default
			oEvent.preventDefault();
			var oBindingContext = oEvent.getParameter('item').getBindingContext();
			var oTabContainer = this.getView().byId("idTabContainer");
			var oItemToClose = oEvent.getParameter('item');
			var vPurchaseOrderDraftUUID = oEvent.getSource().getModel().getProperty('PurchaseOrderDraftUUID', oBindingContext);
			var that = this;
			var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('TabItemClose');
			sap.m.MessageBox.confirm(msgText + " " + oItemToClose.getName() + "?", {
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						//	var vPurchaseOrderDraftUUID = oEvent.getSource().getModel().getProperty('PurchaseOrderDraftUUID', oBindingContext); 
						that.byId("idTabContainer").getBinding("items").refresh();
						var deleteDraftURL = "/C_PurOrderItmDrftForMngPurReqn(PurchaseOrderDraftUUID=guid'" + vPurchaseOrderDraftUUID +
							"',PurchaseOrderItem='')";
						var oModelDrafts = that.oApplicationModel;
						oModelDrafts.setRefreshAfterChange(false);
						var mParams = {};
						mParams.success = jQuery.proxy(that.successDraftDelete, that);
						mParams.error = jQuery.proxy(that.fnErrorPOHeaderDiscard, that);
						oModelDrafts.remove(deleteDraftURL, mParams);
						oTabContainer.removeItem(oItemToClose); // uncommented because of incident - 1880210338
						//	sap.m.MessageToast.show("Item closed: " + oItemToClose.getName(), {duration: 500});
						// } else {
						// 	sap.m.MessageToast.show("Item close canceled: " + oItemToClose.getName(), {
						// 		duration: 500
						// 	});
					}
				}
			});
		},

		fnCreatePurchaseOrder: function (oEvent) {
			var sIdTabContainer = this.byId('idTabContainer').getSelectedItem();
			var sCbPOTypeId = sIdTabContainer.replace('idTabContainerItem', 'idCBPOTypes');
			var oCbPOTYpe = this.byId(sCbPOTypeId);
			if (oCbPOTYpe.getValue('value') === '') {
				oCbPOTYpe.setValueState(sap.ui.core.ValueState.Error);
				oCbPOTYpe.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPOType"));
				this.bSelectPOType = true;
				this.onTypeUpdateSuccess();
			} else {
				var vPurchaseOrderDraftUUID = oEvent.getSource().getBindingContext().getProperty('PurchaseOrderDraftUUID');
				var oDataModel = this.oApplicationModel;
				var oPayload = {
					'PurchaseOrderDraftUUID': vPurchaseOrderDraftUUID
				};
				var buisObj = 'PO';
				var controller = this;
				if (this.getTestMode() === undefined || this.getTestMode() === false) {
					ServiceManager.activateBO(vPurchaseOrderDraftUUID, buisObj, oPayload, controller);
				} else {
					this.activateBoSuccess();
				}
			}
			this.getView().rerender();
			var sMsgPopoverId = sIdTabContainer.replace('idTabContainerItem', 'idBMsgPopover');
			var oMsgPopover = this.byId(sMsgPopoverId);
			oMsgPopover.firePress();
		},
		//POTypeerror replaced with new function name
		onTypeUpdateSuccess: function (data, response) {
			var sIdTabContainer = this.byId('idTabContainer').getSelectedItem();
			var sMsgPopoverId = sIdTabContainer.replace('idTabContainerItem', 'idBMsgPopover');
			var oMsgPopover = this.byId(sMsgPopoverId);
			var aMsg = new Array();
			if (this.bSelectPOType) {
				var oCompErrMessage = {
					icon: "sap-icon://error",
					name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPOType"),
					state: "Error"
				};
				aMsg.push(oCompErrMessage);
				oMsgPopover.setVisible(true);
				this.oMessagePopover = this._getMessagePopover(aMsg);
			} else if (response !== undefined) {
				if (response.headers["sap-message"] !== undefined && JSON.parse(response.headers["sap-message"]).code === 'APPL_MM_PR/017') {
					var oCompErrMessage = {
						icon: "sap-icon://error",
						name: JSON.parse(response.headers["sap-message"]).message,
						state: "Error"
					};
					aMsg.push(oCompErrMessage);
					oMsgPopover.setVisible(true);
					this.oMessagePopover = this._getMessagePopover(aMsg);
				}
			}
		},

		onPOTypeChange: function (oEvent) {
			var bNoMatch = true;
			for (var iComboData = 0; iComboData < oEvent.getSource().getList().getItems().length; iComboData++) {
				if (oEvent.getSource().getList().getItems()[iComboData].getTitle() == oEvent.getSource().getSelectedItem().getText()) {
					bNoMatch = false;
					break;
				}
			}
			if (bNoMatch == true) {
				oEvent.getSource().setValue('');
			}
			var oCBPOType = oEvent.getSource();
			if (oCBPOType.getValue('value') !== '') {
				this.bSelectPOType = false;
				oCBPOType.setValueState(sap.ui.core.ValueState.None);
				var sIdTabContainer = this.byId('idTabContainer').getSelectedItem();
				var sMsgPopoverId = sIdTabContainer.replace('idTabContainerItem', 'idBMsgPopover');
				var oMsgPopover = this.byId(sMsgPopoverId);
				oMsgPopover.setVisible(false);
			}
			var selectedPOTypeKey = oEvent.getSource().getProperty('selectedKey', oEvent.getSource().getBindingContext());
			var vPurchaseOrderDraftUUID = oEvent.getSource().getBindingContext().getProperty('PurchaseOrderDraftUUID');
			var oPayload = {
				'PurchaseOrderDraftUUID': vPurchaseOrderDraftUUID,
				'PurchaseOrderType': selectedPOTypeKey
			};
			var oModel = this.oApplicationModel;
			oModel.setRefreshAfterChange(false);
			var sPOUpdateUrl = "/C_PurOrderDraftForMngPurReqn(guid'" + vPurchaseOrderDraftUUID + "')";
			var mParameters = new Object();
			mParameters.success = jQuery.proxy(this.onTypeUpdateSuccess, this); //relook
			mParameters.error = jQuery.proxy(this.onErrorUpdate, this);
			oModel.update(sPOUpdateUrl, oPayload, mParameters);
		},

		handleItemDelete: function (evt) {
			var oBnCtxtDraftItem = evt.getParameter('listItem').getBindingContext();
			var vPurchaseOrderDraftUUID = evt.getSource().getModel().getProperty('PurchaseOrderDraftUUID', oBnCtxtDraftItem);
			vPurchaseOrderDraftUUID = vPurchaseOrderDraftUUID.trim();
			var vItemNo = evt.getSource().getModel().getProperty('PurchaseOrderItem', oBnCtxtDraftItem);
			var deleteDraftURL = "/C_PurOrderItmDrftForMngPurReqn(PurchaseOrderDraftUUID=guid'" + vPurchaseOrderDraftUUID +
				"',PurchaseOrderItem='" + vItemNo + "')";
			var oModelDrafts = this.oApplicationModel;
			oModelDrafts.remove(deleteDraftURL, {
				success: jQuery.proxy(this.successDraftDelete, this),
				error: jQuery.proxy(this.errorCreateDraft, this)
			});
			oModelDrafts.setRefreshAfterChange(false);
		},

		successDraftDelete: function () {
			//function for success
			if (this._oPopover && this._oPopover.popup) {
				this._oPopover.close();
				var msgText = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('DiscardDiscardSuccess');
				sap.m.MessageToast.show(msgText);
			}
			this.refreshPODrafts();
		},

		successTabClose: function () {
			if (numberOfTabs <= 0) {
				var sPreviousHash = History.getInstance().getPreviousHash(),
					oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
					history.go(-1);
				} else {
					var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "PurchaseRequisition",
							action: "manage"
						}
					});
				}
			}
		},

		onNavBack: function (evt) {
			this.oRouter.navTo("worklist", {}, true);
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

		activateBoSuccess: function (data, response) {
			if (this.getTestMode() == true) {
				var successMessage = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('CREATE_PO_SUCCESS');
				var aCompErrMessage = new Array();
				var oCompErrMessage = {
					name: successMessage,
					state: "Success"
				};
				aCompErrMessage.push(oCompErrMessage);
				var oMessagePopup = this._getMessagePopup(aCompErrMessage);
				//	oMessagePopup.setID("popUpSavePO");
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.setTitle("Purchase Order Number");
				oMessagePopup.open();
				return;
			}

			// var iChangeRespCount = data.__batchResponses[0].__changeResponses.length;
			var iMsgCount = 0;
			var showPopup = false;
			var aMessages = JSON.parse(response.headers['sap-message']).details;
			var aCompErrMessage = new Array();
			// var oCompErrMessage = {
			// 	name: JSON.parse(response.headers['sap-message']).message,
			// 	state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
			// 	icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
			// };

			//		aCompErrMessage.push(oCompErrMessage);
			if (!aMessages.length || (JSON.parse(response.headers['sap-message']).code === "06/017" || JSON.parse(response.headers[
					'sap-message']).code === "MEPO/013")) {
				// showPopup = true;
				if (JSON.parse(response.headers['sap-message']).severity !== "error") {
					showPopup = true;
				}
			}
			successMessage = JSON.parse(response.headers['sap-message']).message;
			var oCompErrMessage = {
				name: successMessage,
				state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
				icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
			};
			aCompErrMessage.push(oCompErrMessage);
			for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
				var successMessage;

				if (aMessages[iMsgCount].code === "06/017" || aMessages[iMsgCount].code === "MEPO/013") {
					successMessage = aMessages[iMsgCount].message;
					showPopup = true;
				} else {
					successMessage = aMessages[iMsgCount].message;
				}
				var oCompErrMessage = {
					name: successMessage,
					state: this._getMessageState(aMessages[iMsgCount].severity),
					icon: this._getMessageIcon(aMessages[iMsgCount].severity)
				};
				aCompErrMessage.push(oCompErrMessage);
			}
			if (showPopup == true) { //popup
				var oMessagePopup = this._getMessagePopup(aCompErrMessage);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
			} else { //popover

				var sIdTabContainer = this.byId('idTabContainer').getSelectedItem();
				var sMsgPopoverId = sIdTabContainer.replace('idTabContainerItem', 'idBMsgPopover');
				var oMsgPopover = this.byId(sMsgPopoverId);
				oMsgPopover.setVisible(true);
				this.oMessagePopover = this._getMessagePopover(aCompErrMessage);
			}

		},
		// NavigateToPO: function (oEvent) {
		// 	var PONumber = this.c;
		// 	var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");

		// 	oCrossAppNavigator.toExternal({
		// 		target: {
		// 			semanticObject: "PurchaseOrder",
		// 			action: "manage"
		// 		},
		// 		params: {
		// 			PurchaseOrder: [PONumber]
		// 		}
		// 	});

		// },
		errorCreateFOD: function (error) {},
		handleMessagePopoverPress: function (oEvent) {
			if (this.getTestMode() === false) {
				this.oMessagePopover.openBy(oEvent.getSource());
			}
		},
		_getMessagePopover: function (aMessages) {

			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(aMessages);

			var viewModel = new sap.ui.model.json.JSONModel();
			viewModel.setData({
				'results.messagesLength': aMessages.length + ''
			});

			this.byId('idBMsgPopover').setModel(viewModel);
			//	this.getView().setModel(viewModel);
			return oMessagePopover.setModel(oModel);
		},

		_getMessagePopup: function (aMessages) {
			var that = this;
			var b = aMessages[0].name;
			//num = extract 10 digit PO number
			var num = b.match(/(\d{10})/)[0];                     //2945046
            var frststring = b.split(b.match(/(\d{10})/)[0]);     //2945046
		
			//numberOfTabs--;
			//numberOfTabs;
			var requisitionText = new sap.m.Text({
					text: frststring[0].toString()
				}),
			 requisitionTextlast = new sap.m.Text({
					text: frststring[1].toString()
				}),	
				linkNumber = new sap.m.Link({
					text: num.toString(),
					press: function (oEvent) {
						var PONumber = this.getText();
						// var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
						// oCrossAppNavigator.isIntentSupported(["PurchaseOrder-manage"]);
						// var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
						// 		target: {
						// 			semanticObject: "PurchaseOrder",
						// 			action: "manage"
						// 		},
						// 		params: {
						// 			PurchaseOrder:[PONumber],
						// 			DraftUUID: '00000000-0000-0000-0000-000000000000',
						// 			IsActiveEntity: 'true'
						// 		}
						// 	}))|| "";
						// var url = window.location.href.split('#')[0] + hash; 
						// //Navigate to second app
						// sap.m.URLHelper.redirect(url, true); 
						//	that.refreshPODrafts();
						var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
						if (numberOfTabs <= 1) {
							oCrossAppNav.toExternal({
								target: {
									semanticObject: "PurchaseOrder",
									action: "manage"
								},
								params: {
									PurchaseOrder: [PONumber],
									DraftUUID: '00000000-0000-0000-0000-000000000000',
									IsActiveEntity: 'true',
								}
							});

						} else {
							oCrossAppNav.toExternal({
								target: {
									semanticObject: "PurchaseOrder",
									action: "manage"
								},
								params: {
									PurchaseOrder: [PONumber],
									DraftUUID: '00000000-0000-0000-0000-000000000000',
									IsActiveEntity: 'true',
									"sap-ushell-navmode": "explace"
								}
							});

						}

					}

				});
			var spaceText = new sap.m.ToolbarSpacer({
				width: "0.25rem"
			});
			var data = {
				"messages": aMessages
			};
			var spaceText1 = new sap.m.ToolbarSpacer({
				width: "4rem"
			});
			var fbox = new sap.m.FlexBox({
				height: "2.5rem",
				alignItems: "Center",
				justifyContent: "Start",
				items: [
					new sap.m.ToolbarSpacer({
						width: "2rem"
					}),

					new sap.ui.core.Icon({
						color: "#277C16",
						src: "sap-icon://message-success"
					})
				]
			});

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
			var horizontalLayout = new sap.ui.layout.HorizontalLayout({
				content: [requisitionText]
			});
			var horizontalLayoutSpace = new sap.ui.layout.HorizontalLayout({
				content: [spaceText]
			});
			var horizontalLayoutSpace1 = new sap.ui.layout.HorizontalLayout({
				content: [spaceText1]
			});
			var horizontalLayoutlast = new sap.ui.layout.HorizontalLayout({
				content: [requisitionTextlast]
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
								//text: "requisitionText",
								text: "{name}",
								layoutData: new sap.ui.layout.GridData({
									span: "L10 M10 S10"
								})
							})
						]
					})
				]
			});
			fbox.addItem(horizontalLayoutSpace1);
			fbox.addItem(horizontalLayout);
			fbox.addItem(horizontalLayoutSpace);
			fbox.addItem(linkNumber);
			fbox.addItem(horizontalLayoutSpace);
			fbox.addItem(horizontalLayoutlast);
		

			var oWindow = this.oRouter;
			var oDataModel = this.oApplicationModel;
			//var oDataModel = this.oApplicationFacade.getODataModel();
			this.vNumberofMessages = data.messages.length;
			var oModel = new sap.ui.model.json.JSONModel();
			data.messages.shift();
			if (data.messages.length == 0) {
				oTable.setVisible(false);
			}
			oModel.setData(data);
			oTable.setModel(oModel);
			oTable.bindAggregation("items", "/messages", template);

			this.oMessageDialog = new sap.m.Dialog({

				content: [fbox,
					//messageStrip,
					oTable

				],
				buttons: [
					new sap.m.Button({
						text: "{i18n>OK}",
						tap: jQuery.proxy(function (e) {
							this.oMessageDialog.close();
							this.refreshPODrafts();
						}, this)
					})
				],
				// afterClose: jQuery.proxy(function (e) {
				// 	this.oMessageDialog.close();
				// 	this.refreshPODrafts();
				// }, this),
				afterClose: function () {
					//	dialogpop.close();
					//	that.oMessageDialog.close();
					that.byId('idTabContainer').getBinding("items").refresh();
					that.refreshPODrafts();
				},
				state: "None",
				contentWidth: "35rem"
			});

			var msgtext = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("MSG");
			this.oMessageDialog.setTitle(msgtext + ' (' + this.vNumberofMessages + ')');
			this.getView().addDependent(this.oMessageDialog);
			this.oMessageDialog.addStyleClass("sapUiSizeCompact");
			return this.oMessageDialog;
		}

	});
});