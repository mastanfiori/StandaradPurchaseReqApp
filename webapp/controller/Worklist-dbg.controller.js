/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator ) {
	"use strict";

	return BaseController.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter = oRouter;
			//Check if some PRs are selected, if yes, enable create PO button 
			this.CreateButtonsEnableCheck();
			// for OVP navigation to PR
			this.bFirstRun = true;
			this.batchCallNum = 0;
			this.oStartupParameters = this.getMyComponent().getComponentData().startupParameters;
			this.getRouter().getRoute("worklist").attachPatternMatched(
				jQuery.proxy(function (evt) {
					var sViewName = evt.getParameter('name');
					if (sViewName) {
						this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
						this.CreateButtonsEnableCheck();
						this.oStartupParameters = this.getMyComponent().getComponentData().startupParameters;
						if (this.byId('idPRItemTable').getBinding("items") != undefined) {
							this.byId('idPRItemTable').getBinding("items").refresh();
							this.byId('idPRItemTable').removeSelections();
						}
						// if (sap.ui.core.routing.History.getInstance()._sCurrentDirection === "NewEntry") {
						// 	var smartFilterBar = this.getView().byId("idSmartFilterPR");
						// 	smartFilterBar.clear();
						// 	smartFilterBar.fireSearch();
						// }
					}
				}, this), this);
		},
		
		setDefaultFitlerParameters: function(){
			var startupParameters = this.oStartupParameters;
			this.pushFiltertoHeader("PurchasingOrganization",startupParameters.PurchasingOrganization);
			this.pushFiltertoHeader("Plant",startupParameters.Plant);
			this.pushFiltertoHeader("Material",startupParameters.Material);
			this.pushFiltertoHeader("PurchasingGroup",startupParameters.PurchasingGroup);
			this.pushFiltertoHeader("Supplier",startupParameters.Supplier);
			this.pushFiltertoHeader("MaterialGroup",startupParameters.MaterialGroup);
		},
		
		pushFiltertoHeader: function(filterName,filterValueArr){
			//check if filterValueArr is defined
			if(filterValueArr){
				var oSmartFilter = this.byId("idSmartFilterPR");
				var oFilter = {};
				var FilterData = function () {
					this.value = null;
					this.ranges = [];
					this.items = [];
				};
				var FilterName = filterName;
				oFilter[FilterName] = new FilterData();
				// for (var i = 0; i < filterValueArr.length; i++) {
					var oFilterRange = {}; // Prepare filter
					oFilterRange.keyField = filterName;
					oFilterRange.value1 = filterValueArr[0];
					oFilterRange.operation = "EQ";
					oFilter[FilterName].ranges.push(oFilterRange); // Set the filter data 
					oSmartFilter.setFilterData(oFilter); // Push the filter data to the Smart Filter
				// }
			}
		},
		
		onNavBack: function (oEvent) {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash === "#Shell-home") {
				var smartFilterBar = this.getView().byId("idSmartFilterPR");
				smartFilterBar.clear();
			}
			window.history.go(-1);
		},

		onBeforeRebindTable: function (oEvent) {
			// Handling Delivery Date grouping                                                                          // 3057108
			var aSorters = [];
			if(oEvent.getParameter("bindingParams")){
				var mBindingParams = oEvent.getParameter("bindingParams");
				//var aSorters = mBindingParams.sorter || [];
				aSorters = mBindingParams.sorter || [];
				var oGroupedProperty = aSorters.find(function(oSorter) {
                    return oSorter.vGroup != null;
				});
				if (oGroupedProperty && oGroupedProperty.sPath == "DeliveryDate") {
					var bExistingSortOrder = oGroupedProperty.bDescending == true ? true : false;
					var headerPrefix = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDate") + ": ";
					mBindingParams.sorter = [
					new sap.ui.model.Sorter("DeliveryDate", bExistingSortOrder, function(oContext) {
                        var oDateFormatter = sap.ui.core.format.DateFormat.getInstance({
							format: "yMMMd"
                        });
                        var myDate = oDateFormatter.format(oContext.getProperty("DeliveryDate"));
                        return {
                            key: myDate,
                            text: headerPrefix + myDate
                        };
                    })
                    ].concat(aSorters);
				}
			}
			if (this.bFirstRun === true) {
				var aSearchFilters = [];
				aSorters = [];
				
				// Handling of Delivery Date filter if added from Adapt Filters starts here
				// if (oEvent.getParameter("bindingParams").filters[0]) {
				// 	var aSmartFilters = oEvent.getParameter("bindingParams").filters[0].aFilters;
				// 	if(aSmartFilters){
				// 	if (aSmartFilters.length === 1) {
				// 		if (aSmartFilters[0].sPath === "FirstDeliveryDate") {
				// 			var dFormattedDate = sap.ui.core.format.DateFormat.getDateInstance({
				// 				pattern: "yyyy-MM-dd"
				// 			});
				// 			var dStartDate = dFormattedDate.format(aSmartFilters[0].oValue1, false);
				// 			var dEndDate = dFormattedDate.format(aSmartFilters[0].oValue2, false);
				// 			aSearchFilters.push(new sap.ui.model.Filter("FirstDeliveryDate", aSmartFilters[0].sOperator, dStartDate, dEndDate));
				// 		}
				// 	} else {
				// 		for (var i = 0; i < aSmartFilters.length; i++) {
				// 			if (aSmartFilters[i].aFilters) {
				// 				for (var j = 0; j < aSmartFilters[i].aFilters.length; j++) {
				// 					if (aSmartFilters[i].aFilters[j].sPath === "FirstDeliveryDate") {
				// 						var dFormattedDate = sap.ui.core.format.DateFormat.getDateInstance({
				// 							pattern: "yyyy-MM-dd"
				// 						});
				// 						var dStartDate = dFormattedDate.format(aSmartFilters[i].aFilters[j].oValue1, false);
				// 						var dEndDate = dFormattedDate.format(aSmartFilters[i].aFilters[j].oValue2, false);
				// 						aSearchFilters.push(new sap.ui.model.Filter("FirstDeliveryDate", aSmartFilters[i].aFilters[j].sOperator, dStartDate, dEndDate));
				// 					} else {
				// 						aSearchFilters.push(aSmartFilters[i].aFilters[j]);
				// 					}
				// 				}
				// 			} else if (aSmartFilters[i].sPath) {
				// 				if (aSmartFilters[i].sPath === "FirstDeliveryDate") {
				// 					var dFormattedDate = sap.ui.core.format.DateFormat.getDateInstance({
				// 						pattern: "yyyy-MM-dd"
				// 					});
				// 					var dStartDate = dFormattedDate.format(aSmartFilters[i].aFilters[0].oValue1, false);
				// 					var dEndDate = dFormattedDate.format(aSmartFilters[i].aFilters[0].oValue2, false);
				// 					aSearchFilters.push(new sap.ui.model.Filter("FirstDeliveryDate", aSmartFilters[i].aFilters[0].sOperator, dStartDate, dEndDate));
				// 				} else {
				// 					aSearchFilters.push(aSmartFilters[i]);
				// 				}
				// 			}
				// 		}
				// 	}
				// 	 }
				// } // Handling of Delivery Date filter if added from Adapt Filters ends here
				// if (oEvent.getParameter("bindingParams").sorter[0]) {
				// 	var aAllSorters = oEvent.getParameter("bindingParams").sorter;
				// 	for (var i = 0; i < aAllSorters.length; i++) {
				// 		if (aAllSorters[i].sPath === "DeliveryDate") {
				// 			var aDateSorter = aAllSorters[i];
				// 			aAllSorters[i].sPath = "FirstDeliveryDate";
				// 			aSorters.push(aDateSorter);
				// 		} else {
				// 			aSorters.push(aAllSorters[i]);
				// 		}
				// 	}
				// }
				if (this.getTestMode()) { //call from, unit test, initialize oStartupParameters with test data
					// oStartupParameters.PurchaseRequisition = '';
					// oStartupParameters.FormattedPurRequisitionItem = '';
					var oStartupParameters = this.oStartupParameters;
					oStartupParameters.PresentationVariant = ["PRDue"];
					oStartupParameters.source = 'lpd';
					oStartupParameters.PurReqnHasFllwOnDoc = "PurReqnHasFllwOnDoc 1";
					oStartupParameters.Supplier = "Supplier 1";
					oStartupParameters.FixedSupplier = "FixedSupplier 1";
					oStartupParameters.Material = "Material 1";
					oStartupParameters.MaterialGroup = "MaterialGroup 1";
					// oStartupParameters.PurchasingGroup = "";
					// oStartupParameters.PurchasingOrganization = "";
					// oStartupParameters.Plant = "";
				}
				else if(sap.ui.core.routing.History.getInstance()._sCurrentDirection === "NewEntry"){
				 	//setting default parameters (Only Single Value Parameter supported) -  chr
				 	this.setDefaultFitlerParameters();
				 	var oStartupParameters = this.oStartupParameters;
				}
				 
				if ((oEvent.getSource().getId().indexOf("idSmartTablePR")) > 0) {
					if (oStartupParameters !== undefined && this.bFirstRun === true) {
						if (oStartupParameters.PurchaseRequisition !== undefined) {
							var asearchPRs = oStartupParameters.PurchaseRequisition;
						}
						if (oStartupParameters.FormattedPurRequisitionItem !== undefined) {
							this.bIsNavigatedFromOVP = true;
							var asearchPRItems = oStartupParameters.FormattedPurRequisitionItem;
						}
						if (oStartupParameters.source === 'lpd') {
							this.navigationToHome = true;
						}
						if (oStartupParameters.PresentationVariant !== undefined) {
							if (!oStartupParameters.FormattedPurRequisitionItem) {
								var aPresentationVariant = oStartupParameters.PresentationVariant;
								if (aPresentationVariant[0] === "PRDue") {
									var oTable = this.byId("idPRItemTable");
									//	var oBinding = oTable.getBinding("items");
									aSorters = [
										new sap.ui.model.Sorter("FirstDeliveryDate", false),
										new sap.ui.model.Sorter("PurReqnPrice", true)
									];
								}
							}
						}

						if (oStartupParameters && sap.ui.core.routing.History.getInstance()._sCurrentDirection === "NewEntry") {
							var asearchSupplier = oStartupParameters.Supplier;
							var asearchFixedSupplier = oStartupParameters.FixedSupplier;
							var asearchMaterial = oStartupParameters.Material;
							var asearchMaterialGroup = oStartupParameters.MaterialGroup;
							var asearchPurchasingGroup = oStartupParameters.PurchasingGroup;
							var asearchPurchasingOrganization = oStartupParameters.PurchasingOrganization;
							var asearchPlant = oStartupParameters.Plant;
							//for PRs with no supplier assigned when navigating from OVP card

							if (oStartupParameters.Supplier !== undefined) {
								var filterSupplierParam = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, asearchSupplier);
								aSearchFilters.push(filterSupplierParam);
							}
							if (oStartupParameters.FixedSupplier !== undefined) {
								var filterFixedSupplierParam = new sap.ui.model.Filter("FixedSupplier", sap.ui.model.FilterOperator.EQ, asearchFixedSupplier);
								aSearchFilters.push(filterFixedSupplierParam);
							}
							if (oStartupParameters.Material !== undefined) {
								var filterMaterialParam = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, asearchMaterial);
								aSearchFilters.push(filterMaterialParam);
							}
							if (oStartupParameters.MaterialGroup !== undefined) {
								var filterMaterialGroupParam = new sap.ui.model.Filter("MaterialGroup", sap.ui.model.FilterOperator.EQ, asearchMaterialGroup);
								aSearchFilters.push(filterMaterialGroupParam);
							}
							if (oStartupParameters.PurchasingGroup !== undefined) {
								var filterPurchasingGroupParam = new sap.ui.model.Filter("PurchasingGroup", sap.ui.model.FilterOperator.EQ,
									asearchPurchasingGroup);
								aSearchFilters.push(filterPurchasingGroupParam);
							}
							if (oStartupParameters.PurchasingOrganization !== undefined) {
								var filterPurchasingOrganizationParam = new sap.ui.model.Filter("PurchasingOrganization", sap.ui.model.FilterOperator.EQ,
									asearchPurchasingOrganization);
								aSearchFilters.push(filterPurchasingOrganizationParam);
							}
							if (oStartupParameters.Plant !== undefined) {
								var filterPlantParam = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, asearchPlant);
								aSearchFilters.push(filterPlantParam);
							}
						} 
						if(oStartupParameters.PurReqnHasFllwOnDoc !== undefined){ //most of the time === undefined
							var asearchPurReqnFollowOnDoc = oStartupParameters.PurReqnHasFllwOnDoc;
							var filterPurReqnFollowOnDocParam = new sap.ui.model.Filter("PurReqnHasFllwOnDoc", sap.ui.model.FilterOperator.EQ,
								asearchPurReqnFollowOnDoc);
							aSearchFilters.push(filterPurReqnFollowOnDocParam);
						//for PRs with filters assigned when navigating from OVP card
						}
					}
					for (var iCnt in asearchPRItems) {
						var searchValueForPRItem = asearchPRItems[iCnt];
						//	this.byId("smartFilterId").getBasicSearchControl().fireSearch();
						var oTable = this.byId("idPRItemTable");
						var oBinding = oTable.getBinding("items");
						searchValueForPRItem = searchValueForPRItem.replace( /\s+/g , '');								//Removing Empty Spaces in the String
						var prNumber = searchValueForPRItem.split(/[.?/]/)[0];
						var itemNumber = searchValueForPRItem.split(/[.?/]/)[1];
						this.byId("idSmartFilterPR").getBasicSearchControl().setValue(prNumber);
						var filterPrParam = new sap.ui.model.Filter("PurchaseRequisition", sap.ui.model.FilterOperator.Contains, prNumber);
						aSearchFilters.push(filterPrParam);
						var filterItemParam = new sap.ui.model.Filter("PurchaseRequisitionItem", sap.ui.model.FilterOperator.Contains, itemNumber);
						aSearchFilters.push(filterItemParam);
					}
					if (asearchPRs) {
						var filterPrParam = new sap.ui.model.Filter("PurchaseRequisition", sap.ui.model.FilterOperator.Contains, asearchPRs);
						this.byId("idSmartFilterPR").getBasicSearchControl().setValue(asearchPRs);
						aSearchFilters.push(filterPrParam);
					}

					//Variable bFirstRun was set in onInit for OVP navigation case. 
					//When the User adds a filter manually, the above logic should not be executed  anymore.
					// if(this.bFirstRun === true){
					this.bFirstRun = false;

				}
				if (aSearchFilters.length > 0) {
					oEvent.getParameter("bindingParams").filters = aSearchFilters;
				}
				if (aSorters.length > 0) {
					oEvent.getParameter("bindingParams").sorter = aSorters;
				}
			}
		},

		getMyComponent: function () {
			"use strict";
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			return sap.ui.component(sComponentId);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/*		onSearch: function(oEvent) {    //unused method, hence commented
					if (oEvent.getParameters().refreshButtonPressed) {
						// Search field's 'refresh' button has been pressed.
						// This is visible if you select any master list item.
						// In this case no new search is triggered, we only
						// refresh the list binding.
						this.onRefresh();
					} else {
						var oTableSearchState = [];
						var sQuery = oEvent.getParameter("query");

						if (sQuery && sQuery.length > 0) {
							oTableSearchState = [new Filter("PurchaseRequisition", FilterOperator.Contains, sQuery)];
						}
						this._applySearch(oTableSearchState);
					}

				},*/

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		// onRefresh: function() {       //unused method, hence commented
		// 	this._oTable.getBinding("items").refresh();
		// },

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {object} oTableSearchState an array of filters for the search
		 * @private
		 */
		// _applySearch: function(oTableSearchState) {       //unused method, hence commented
		// 	var oViewModel = this.getModel("worklistView");
		// 	this._oTable.getBinding("items").filter(oTableSearchState, "Application");
		// 	// changes the noDataText of the list in case there are no filter results
		// 	if (oTableSearchState.length !== 0) {
		// 		oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		// 	}
		// },
		/*Event to handle click of PR Lineitem*/
		onPressPurReqn: function (oEvent) {
			var oSelectedLine = oEvent.getSource().getBindingContext().getObject();
			var vSelectedPR = oSelectedLine.PurchaseRequisition;
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "PurchaseRequisition",
					action: "maintain"
				},
				params: {
					DraftUUID: "00000000-0000-0000-0000-000000000000",
					PurchaseRequisition: vSelectedPR,
					IsActiveEntity: "true"
				}
			});
		},
		

		onPressMaterialFactSheet: function (oEvent) {
			var oSelectedLine = oEvent.getSource().getBindingContext().getObject();
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "Material",
					action: "displayFactSheet"
				},
				params: {
					Material: [oSelectedLine.Material]
				}
			});
		},

		onPressSuppBusinessCard: function (oEvent) {
			this.idSourceVendorFgt = oEvent.getSource().getId();
			var vVendor = oEvent.getSource().getBindingContext().getObject().FixedSupplier;
			if (vVendor === "" || vVendor === undefined) {
				vVendor = oEvent.getSource().getBindingContext().getObject().Supplier;
			}
			// if ( vVendor.indexOf("(") > -1 )
			// 				{
			// var aVendorId = vVendor.split('(');
			// var sVendorId = aVendorId[aVendorId.length - 1];
			// sVendorId = sVendorId.slice(0, sVendorId.length - 1);
			// }
			var oModelVendor = this.getModel();
			//	var vURLVendor = "/VendorSet(Supplier='" + sVendorId + "')";
			var vURLVendor = "/VendorSet(Supplier='" + vVendor + "')";
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.BusinessCard", this);
				this.getView().addDependent(this._oPopover);
			} else if (this._oPopover.bIsDestroyed) {
				this._oPopover = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.fragment.BusinessCard", this);
				this.getView().addDependent(this._oPopover);
			}
			var mParameters = {
				success: jQuery.proxy(this.BusinessCardData, this)
			};
			oModelVendor.read(vURLVendor, mParameters);
			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oFixedVendorClick = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oPopover.openBy(oFixedVendorClick);
			});
		},
		onCallAfterClose: function (oEvent) {
			this._oPopover.destroy();
		},

		callBusinessCard: function (oEvent) {
			sap.m.URLHelper.triggerTel(oEvent.getSource().getText());
		},

		emailBusinessCard: function (oEvent) {
			sap.m.URLHelper.triggerEmail(oEvent.getSource().getText());
		},

		BusinessCardData: function (data, response) {
			this._oPopover.setModel(new sap.ui.model.json.JSONModel(data));
			this._oPopover.setContentHeight('auto');
		},

		CreateButtonsEnableCheck: function (oEvent, bIsCreatePO) { // to enable create PO and create RFQ buttons
			//check if navigated back from Contract Preview screen, if yes fire search
			if (this.bIsContractPreview) {
				this.byId("smartFilterId").getBasicSearchControl().fireSearch();
			}
			var oSelectedItems = this.byId("idPRItemTable").getSelectedContexts();
			var iItems, oData, bEnabledPO, bEnabledRFQ, bEnabledCTR;
			//by default enable both
			bEnabledPO = true;
			bEnabledRFQ = true;
			bEnabledCTR = true;

			if (oSelectedItems.length == 0) // atleast one item should be selected
			{
				bEnabledPO = false;
				// Disable create RFQ as well
				bEnabledRFQ = false;
				bEnabledCTR = false;
			} else {
				for (iItems = 0; iItems < oSelectedItems.length; iItems++) {
					oData = oSelectedItems[iItems].getProperty(oSelectedItems[iItems].getPath()); // selected item should have a SoS selected
					if ((oData.FixedSupplier === null || oData.FixedSupplier === undefined || oData.FixedSupplier === "") && (oData.Supplier === null ||
							oData.Supplier ===
							undefined || oData.Supplier === "")) {
						// No SOS, disable create po
						bEnabledPO = false;
					} else if (parseFloat(oData.OrderedQuantity) >= parseFloat(oData.RequestedQuantity)) {
						//PO created, quantity exceeded, both buttons disabled
						bEnabledRFQ = false;
						bEnabledCTR = false;
						// For Limit Items, quantity can be 0, so enable the Create Button always for limit items
						// if (oData.PurchasingDocumentItemCategory === "A") {
						// 	bEnabledPO = true;
						// } else {
						// 	bEnabledPO = false;
						// }

						//Added By I516384
						bEnabledPO = ((oData.PurchasingDocumentItemCategory === "A") ? true : false);
						//Added By I516384 - end

					}

					//Added By I516384
					bEnabledPO = ((oData.PurchasingDocumentSubtype === "R") ? false : bEnabledPO);

					//PR item control indicator is ‘R’ and Processing Status is Contract Created
					bEnabledCTR = (oData.ProcessingStatus === "K" && oData.PurchasingDocumentSubtype === "R") ? false : bEnabledCTR;

					//PR item control indicator is ‘R’ and Processing Status is Contract Created
					bEnabledRFQ = (oData.ProcessingStatus === "K" && oData.PurchasingDocumentSubtype === "R") ? false : bEnabledRFQ;

					//Item category is not Standard material (Should not support simple service as well)
					bEnabledCTR = ((oData.PurchasingDocumentItemCategory !== "0") ? false : bEnabledCTR);
					bEnabledRFQ = ((oData.PurchasingDocumentItemCategory !== "0") ? false : bEnabledRFQ);

					//Check for simple service
		//			bEnabledRFQ = ((oData.ProductType === "2") ? false : bEnabledRFQ);
					//Added By I516384 - end

					bEnabledCTR = ((oData.PurchasingDocumentItemCategory === "A") ? false : bEnabledCTR);

					if (oData.PurReqnCmpltnsCat === "H" || oData.PurReqnCmpltnsCat === "P") {
						bEnabledPO = false;
						bEnabledRFQ = false;
						bEnabledCTR = false;
						break;
					}
				}
			}
			this.byId("CreatePO").setEnabled(bEnabledPO);
			this.byId("CreateRFQ").setEnabled(bEnabledRFQ);
			this.byId("CreateCTR").setEnabled(bEnabledCTR);
			///
			if (bIsCreatePO === "PO") {
				return bEnabledPO;
			} else if (bIsCreatePO === "CTR") 
			{
			// for CTR	
				return bEnabledCTR;
			}
             else
			 {
			 // for RFQ	
				return bEnabledRFQ;
			}

		},
		
		onPressCreateDraftPO: function (oEvent) {
			this.onPressCreateDraft(oEvent, "PO");
		},

		onPressCreateDraftRFQ: function (oEvent) {
			var selecteditems = this.byId("idPRItemTable").getSelectedContexts();
			if (selecteditems.length === 0) {
				var aErrMessage = new Array();
				var oMessagePopup;
				var oErrMsg = {
					name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPRIsSelected"),
					state: this._getMessageState("error"),
					icon: this._getMessageIcon("error")
				};
				aErrMessage.push(oErrMsg);
				oMessagePopup = this._getMessagePopup(aErrMessage);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
				return;
			}
			var firstrfq = selecteditems[0].getProperty(selecteditems[0].getPath());
			var vPurOrg = firstrfq.PurchasingOrganization;
			var vPurGrp = firstrfq.PurchasingGroup;
			var porgflag = true;
			var vNavFlag = false;
			var bIsRfq = true;
			var aAddrErrMessage = new Array();
			var oMessagePopup;
			for (var i = 1; i < selecteditems.length; i++) {
				var chkrfq = selecteditems[i].getProperty(selecteditems[i].getPath());
				if (vPurOrg !== chkrfq.PurchasingOrganization || vPurGrp !== chkrfq.PurchasingGroup) {
					//oMessagePopup = this._getPopupforDiffPorg(oEvent);
					//	oMessagePopup.open();
					var oPorgErrMsg = {
						name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("PopUpTxt"),
						state: this._getMessageState("error"),
						icon: this._getMessageIcon("error")
					};
					aAddrErrMessage.push(oPorgErrMsg);
					porgflag = false;
					break;
				}
			}
			for (i = 0; i < selecteditems.length; i++) {
				var oRFQForAddr = selecteditems[i].getProperty(selecteditems[i].getPath());
				//check if the purchasingdocumentitemcategory - only standard and third party supported
				if (oRFQForAddr.PurchasingDocumentItemCategory !== "0" && oRFQForAddr.PurchasingDocumentItemCategory !== "5") {
					var oAddrErrMsg = {
						name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPRCategory") +
							" " + oRFQForAddr.PurchaseRequisition + "/" + oRFQForAddr.PurchaseRequisitionItem,
						state: this._getMessageState("error"),
						icon: this._getMessageIcon("error")
					};
					aAddrErrMessage.push(oAddrErrMsg);
				} else if (oRFQForAddr.Cityname === "" || oRFQForAddr.Country === "") {
					var oAddrErrMsg = {
						name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errAdd") + " " + oRFQForAddr.PurchaseRequisition +
							"/" +
							oRFQForAddr.PurchaseRequisitionItem,
						state: this._getMessageState("error"),
						icon: this._getMessageIcon("error")
					};
					aAddrErrMessage.push(oAddrErrMsg);
				}
				// var oDeliverydate = oRFQForAddr.DeliveryDate;
				// var oPerformancePeriodStartDate = oRFQForAddr.PerformancePeriodStartDate;
				// var oPerformancePeriodEndDate = oRFQForAddr.PerformancePeriodEndDate;
				// var oCurrDate = new Date();
				//Simple Service Items
				// if (oRFQForAddr.ProductType === "2") {
				// 	if ((oCurrDate > oPerformancePeriodEndDate && oCurrDate.getDate() !==
				// 			oPerformancePeriodEndDate.getDate())) {
				// 		var oDelErrMsg = {
				// 			name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errEndDate") + " " + oRFQForAddr.PurchaseRequisition +
				// 				"/" +
				// 				oRFQForAddr.PurchaseRequisitionItem,
				// 			state: this._getMessageState("error"),
				// 			icon: this._getMessageIcon("error")
				// 		};
				// 		aAddrErrMessage.push(oDelErrMsg);
				// 	}
				// } else if (oDeliverydate === null || oDeliverydate === undefined || (oCurrDate > oDeliverydate)) {
				// 	var oDelErrMsg = {
				// 		name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errDeliveryDate") + " " + oRFQForAddr.PurchaseRequisition +
				// 			"/" +
				// 			oRFQForAddr.PurchaseRequisitionItem,
				// 		state: this._getMessageState("error"),
				// 		icon: this._getMessageIcon("error")
				// 	};
				// 	aAddrErrMessage.push(oDelErrMsg);
				// }
			}
			if (aAddrErrMessage.length > 0) {
				oMessagePopup = this._getMessagePopup(aAddrErrMessage, vNavFlag, bIsRfq);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
			} else if (porgflag === true) {
				var buttonID = oEvent.getSource().getId();
				var isRFQButton = buttonID.match("CreateRFQ");
				if (isRFQButton !== null || isRFQButton !== undefined) {
					this.onPressCreateDraft(oEvent, "CreateRFQ");
				}
			}
		},

		onPressCreateDraftCTR: function (oEvent) {
			this.onPressCreateDraft(oEvent, "CreateCTR");
		},

		onPressCreateDraft: function (oEvent, bIsRFQCreateDraft) {
			var oSelectedItems = this.byId("idPRItemTable").getSelectedContexts();
			if (oSelectedItems.length === 0) {
				var aErrMessage = new Array();
				var oMessagePopup;
				var oErrMsg = {
					name: this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errPRIsSelected"),
					state: this._getMessageState("error"),
					icon: this._getMessageIcon("error")
				};
				aErrMessage.push(oErrMsg);
				oMessagePopup = this._getMessagePopup(aErrMessage);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
				return;
			}
		var aBatch = [];
			if (bIsRFQCreateDraft === "PO") {
				var bAllowAction = this.CreateButtonsEnableCheck(oEvent, "PO");
			} 
			else if (bIsRFQCreateDraft === "CreateCTR") {
				var bAllowAction = this.CreateButtonsEnableCheck(oEvent, "CTR");
			}
			else {
				var bAllowAction = this.CreateButtonsEnableCheck();
			}
			if (bAllowAction === true) {
				var sFollowOnDocumentType;
				this.byId('CreatePO').setEnabled(false);
				this.byId('CreateRFQ').setEnabled(false);
				this.byId('CreateCTR').setEnabled(false);
				var oSelectedItems = this.byId("idPRItemTable").getSelectedContexts();
				// var oDataPRModel = '/sap/opu/odata/sap/MM_PUR_PR_PROCESS_SRV';
				// var oDataModel = new sap.ui.model.odata.ODataModel(oDataPRModel);
				// var oDataModel = this.getModel();
				// var oDataModel = this.oApplicationFacade.getODataModel();

				if (bIsRFQCreateDraft === "CreateRFQ") {
					sFollowOnDocumentType = "RFQ";
				} else if (bIsRFQCreateDraft === "CreateCTR") {
					sFollowOnDocumentType = "CONTR";
				} else {
					sFollowOnDocumentType = "PO";
				}
				this.batchCallNum = 0;
				for (var iSelectedPRCount = 0; iSelectedPRCount < oSelectedItems.length; iSelectedPRCount++) {
					var oContextData = oSelectedItems[iSelectedPRCount].getProperty(oSelectedItems[iSelectedPRCount].getPath());
					if (!oContextData.PurchaseRequisitionItem) {
						var sSelectedPRsPath = oSelectedItems[iSelectedPRCount].getPath();
						var aSplitPath = sSelectedPRsPath.split("'");
						oContextData.PurchaseRequisitionItem = aSplitPath[3];
					}
					var oPayload = {
						'Purchaserequisition': oContextData.PurchaseRequisition,
						'Purchaserequisitionitem': oContextData.PurchaseRequisitionItem,
						'Followondocumenttype': sFollowOnDocumentType
					};

					if (!this.getTestMode()) {
						this.getModel().callFunction("/CreateDrafts", {
							method: "POST",
							urlParameters: oPayload,
							success: jQuery.proxy(this.successCreateDraft, this, sFollowOnDocumentType),
							error: jQuery.proxy(this.errorCreateDraft, this)
						});
						this.batchCallNum = this.batchCallNum + 1;
					} else if (sFollowOnDocumentType === "CONTR") {
						this.oRouter.navTo("ContractPreview");
					} else {
						this.oRouter.navTo("PurchaseOrderPreview");
					}
				}
				// if (sFollowOnDocumentType === "RFQ") {
				// 	this.getModel().submitChanges(jQuery.proxy(this.successCreateDraft, this, "RFQ"), jQuery.proxy(this.errorCreateDraft, this),
				// 		true);
				// } else if (sFollowOnDocumentType === "PO") {
				// 	this.getModel().submitChanges(jQuery.proxy(this.successCreateDraft, this, "PO"), jQuery.proxy(this.errorCreateDraft, this),
				// 		true);
				// } else if (sFollowOnDocumentType === "CONTR") {
				// 	this.getModel().submitChanges(jQuery.proxy(this.successCreateDraft, this, "CONTR"), jQuery.proxy(this.errorCreateDraft, this),
				// 		true);
				// }
			}
		},
		successCreateDraft: function (doctype, data, response) {
			var vNavFlag = true;
			if (data.__batchResponses !== undefined) {
				var iChangeRespCount = data.__batchResponses[0].__changeResponses.length;
			} else if (response.headers['sap-message'] !== undefined &&
				((JSON.parse(response.headers["sap-message"]).code === 'APPL_MM_PR/014') ||
					(JSON.parse(response.headers["sap-message"]).code === 'APPL_MM_PR/015') ||
					(JSON.parse(response.headers["sap-message"]).code === 'APPL_MM_PR/016') ||
					(JSON.parse(response.headers["sap-message"]).code === 'APPL_MM_PR/017')
				)
			) { // authorization messages
				var bPOAuthMsg = true;
			} else {
				var iChangeRespCount = 0;
			}
			var aErrMessage = new Array();
			if (response.headers['sap-message']) {
				var aMsgDetails = JSON.parse(response.headers['sap-message']).details;
				var aMessage = JSON.parse(response.headers['sap-message']);
				var aErrorMessage = {
					name: aMessage.message,
					state: this._getMessageState(aMessage.severity),
					icon: this._getMessageIcon(aMessage.severity)
				};
				if (doctype === 'PO' && JSON.parse(response.headers['sap-message']).code === 'APPL_MM_PR/019') {
					vNavFlag = false;
				}
				aErrMessage.push(aErrorMessage);
				if (aMsgDetails !== undefined) {
					if (aMsgDetails.length > 0) {
						for (var iMsgCount = 0; iMsgCount < aMsgDetails.length; iMsgCount++) {
							aErrorMessage = {
								name: aMsgDetails[iMsgCount].message,
								state: this._getMessageState(aMsgDetails[iMsgCount].severity),
								icon: this._getMessageIcon(aMsgDetails[iMsgCount].severity)
							};
							aErrMessage.push(aErrorMessage);
							if (doctype === 'PO') {
								if (JSON.parse(response.headers['sap-message']).details[iMsgCount].code === 'APPL_MM_PR/019') {
									vNavFlag = false;
								}
							}
						}
					}
				}
			}
			var aRFQMessage = new Array();
			if (doctype === "RFQ") {
				if (response.headers['sap-message']) {
					var aPRLockedMessage;
					var vErrorCode = JSON.parse(response.headers['sap-message']).code;
					var vErrorMsg = JSON.parse(response.headers['sap-message']);
					var aMessages = JSON.parse(response.headers['sap-message']).details;
					if (vErrorCode === "MM_PUR_RFQ/047" || vErrorMsg.severity === "error") {
						aPRLockedMessage = {
							name: vErrorMsg.message,
							state: this._getMessageState(vErrorMsg.severity),
							icon: this._getMessageIcon(vErrorMsg.severity)
						};
						aRFQMessage.push(aPRLockedMessage);
					} else if (aMessages !== undefined) {
						if (aMessages.length > 0) {
							for (var i = 0; i < aMessages.length; i++) {
								if (aMessages[i].code === "MM_PUR_RFQ/047" || vErrorMsg.severity === "error") {
									aPRLockedMessage = {
										name: aMessages[i].message,
										state: this._getMessageState(aMessages[i].severity),
										icon: this._getMessageIcon(aMessages[i].severity)
									};
									aRFQMessage.push(aPRLockedMessage);
									break;
								}
							}
						}
					}
				}
				var vRFQDraftID;
				if (response.headers['sap-message']) {
					var vErrorCode = JSON.parse(response.headers['sap-message']).code;
					var aMessages = JSON.parse(response.headers['sap-message']).details;
					if (doctype === 'PO' && vErrorCode === 'APPL_MM_PR/019') {
						vNavFlag = false;
					}
					if (vErrorCode === "DraftId/101") {
						vRFQDraftID = JSON.parse(response.headers['sap-message']).message;
					} else if (aMessages !== undefined) {
						if (aMessages.length > 0) {
							for (var i = 0; i < aMessages.length; i++) {
								if (JSON.parse(response.headers['sap-message']).details[i].code === "DraftId/101") {
									vRFQDraftID = JSON.parse(response.headers['sap-message']).details[i].message;
									break;
								}
							}
						}
					}
				}
			}
			// if (doctype === "CONTR"){
			// 	var vCtrRootGuid;
			// 	if(response.headers['sap-message']){
			// 		var vCtrGuidCode = JSON.parse(response.headers['sap-message']).code;
			// 		if (vCtrGuidCode === "CtrDraftRootGuid/101") {
			// 			vCtrRootGuid = JSON.parse(response.headers['sap-message']).message;
			// 		}
			// 	}
			// }
			var iNoOfErrorMsgs = 0;
			if (bPOAuthMsg) {
				vNavFlag = false;
				var iMsgCount = 0;
				var aMessages = JSON.parse(response.headers['sap-message']).details;
				var aCompErrMessage = new Array();
				var oCompErrMessage = {
					name: JSON.parse(response.headers['sap-message']).message,
					state: this._getMessageState(JSON.parse(response.headers['sap-message']).severity),
					icon: this._getMessageIcon(JSON.parse(response.headers['sap-message']).severity)
				};
				aCompErrMessage.push(oCompErrMessage);
				iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
				for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
					oCompErrMessage = {
						name: aMessages[iMsgCount].message,
						state: this._getMessageState(aMessages[iMsgCount].severity),
						icon: this._getMessageIcon(aMessages[iMsgCount].severity)
					};
					if (aMessages[iMsgCount].severity === 'warning' || aMessages[iMsgCount].severity === 'error') {
						aCompErrMessage.push(oCompErrMessage);
						iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
					}
				}
				var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag, false);
				if (iNoOfErrorMsgs > 0) {
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
					oMessagePopup.open();
				}
			} else if (iChangeRespCount > 0) {
				if (data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']) {
					var iMsgCount = 0;
					var aMessages = JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).details;
					var aCompErrMessage = new Array();
					var oCompErrMessage = {
						name: JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).message,
						state: this._getMessageState(JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message'])
							.severity),
						icon: this._getMessageIcon(JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).severity)
					};
					if (JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).severity === 'warning' ||
						JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).severity === 'error') {
						if ((JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).code) === 'NO_NAV/100' &&
							(JSON.parse(data.__batchResponses[0].__changeResponses[iChangeRespCount - 1].headers['sap-message']).message) ===
							'S:NO_NAV:100'
						)
							vNavFlag = false;
						else {
							aCompErrMessage.push(oCompErrMessage);
							iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
						}
					}

					for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
						oCompErrMessage = {
							name: aMessages[iMsgCount].message,
							state: this._getMessageState(aMessages[iMsgCount].severity),
							icon: this._getMessageIcon(aMessages[iMsgCount].severity)
						};
						if (aMessages[iMsgCount].severity === 'warning' || aMessages[iMsgCount].severity === 'error') {
							if ((aMessages[iMsgCount].code === 'NO_NAV/100') && (aMessages[iMsgCount].message === 'S:NO_NAV:100')) {
								vNavFlag = false;
							} else {
								aCompErrMessage.push(oCompErrMessage);
								iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
							}
						}
					}
					if (doctype === "PO") {
						var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag, false);
					} else if (doctype === "CONTR") {
						var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag, false);
					} else if (doctype === "RFQ") {
						var oMessagePopup = this._getMessagePopup(aCompErrMessage, vNavFlag, true, vRFQDraftID);
					}

					if (iNoOfErrorMsgs > 0) {
						jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
						oMessagePopup.open();
					} else {
						if (doctype === "PO") {
							//this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
							this.oRouter.navTo("PurchaseOrderPreview");
						} else if (doctype === "CONTR") {
							this.oRouter.navTo("ContractPreview");
							//if(vCtrRootGuid)
							//this.oRouter.navTo("ContractPreview", {CtrRootGuid : vCtrRootGuid});
						} else {
							if (vRFQDraftID) {
								this.oRouter.navTo("RFQPreview", {
									RFQid: vRFQDraftID
								});
							}
						}
					}
				}
			} else {
				if (doctype === "PO") {
					if (this.batchCallNum == 1) {
						//this.oRouter.navTo("PurchaseOrderPreview");
						//} else {
						if (aErrMessage.length > 0) {
							var oMessagePopup = this._getMessagePopup(aErrMessage, vNavFlag, false);
							jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
							oMessagePopup.open();
						} else {
							this.oRouter.navTo("PurchaseOrderPreview");
						}
					}
				} else if (doctype === "CONTR") {
					this.oRouter.navTo("ContractPreview");
					//if(vCtrRootGuid)
					//this.oRouter.navTo("ContractPreview", {CtrRootGuid : vCtrRootGuid});
				} else {
					if (aRFQMessage.length > 0) {
						var oMessagePopup = this._getMessagePopup(aRFQMessage, vNavFlag, true);
						jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
						oMessagePopup.open();
					} else {
						if (vRFQDraftID) {
							vRFQDraftID = vRFQDraftID.substr(0, 8) + '-' + vRFQDraftID.substr(8, 4) + '-' + vRFQDraftID.substr(12, 4) +
								'-' + vRFQDraftID.substr(
									16, 4) + '-' + vRFQDraftID.substr(20, 12);
							this.oRouter.navTo("RFQPreview", {
								RFQid: vRFQDraftID
							});
						}
					}
				}
			}
			if (this.batchCallNum > 1) {
				this.batchCallNum = this.batchCallNum - 1;
			}
		},

		errorCreateDraft: function (err) {},

		_getMessageState: function (severity) {
			switch (severity) {
			case 'error':
				return sap.ui.core.ValueState.Error;
			case 'Error':
				return sap.ui.core.ValueState.Error;
			case 'warning':
				return sap.ui.core.ValueState.Warning;
			case 'Warning':
				return sap.ui.core.ValueState.Warning;
			case 'success':
				return sap.ui.core.ValueState.Success;
			case 'Success':
				return sap.ui.core.ValueState.Success;
			case 'information':
				return sap.ui.core.ValueState.Success;
			case 'info':
				return sap.ui.core.ValueState.Success;
			}
		},
		_getMessageIcon: function (severity) {
			switch (severity) {
			case 'error':
				return "sap-icon://error";
			case 'Error':
				return "sap-icon://error";
			case 'warning':
				return "sap-icon://notification";
			case 'Warning':
				return "sap-icon://notification";
			case 'Success':
				return "sap-icon://sys-enter";
			case 'success':
				return "sap-icon://sys-enter";
			case 'information':
				return "sap-icon://sys-enter";
			case 'info':
				return "sap-icon://sys-enter";
			}
		},

		_getMessagePopup: function (aMessages, vNavFlag, bIsRfq, RfqDraft) {
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
						width: "0rem",
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
						vSpacing: 18,
						hSpacing: 0,
						content: [
							new sap.m.ObjectStatus({
								icon: "{icon}",
								state: "{state}",
								layoutData: new sap.ui.layout.GridData({
									span: "L1 M1 S1"
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
						text: "{i18n>Close}",
						press: jQuery.proxy(function (e) {
							this.oMessageDialog.close();
							if (vNavFlag == true && bIsRfq == false) {
								this.oRouter.navTo("PurchaseOrderPreview");
							}
							/*if (vNavFlag == true && bIsRfq == true) {
								this.oApplicationFacade.oApplicationImplementation.setModel(RfqDraft, "selectedRFQDraftId");
								this.oRouter.navTo("RFQPreview");
							}*/
							//            this.oRouter.navTo("RFQPreview");
						}, this),
					}),
				],
				state: "None",
				contentWidth: "25rem",
			});
			if (bIsRfq === true) {
				var errortext = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("Error");
				this.oMessageDialog.setTitle(errortext + ' (' + this.vNumberofMessages + ')');
			} else {
				var msgtext = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("MSG");
				this.oMessageDialog.setTitle(msgtext + ' (' + this.vNumberofMessages + ')');
			}
			this.getView().addDependent(this.oMessageDialog);
			this.oMessageDialog.addStyleClass("sapUiSizeCompact");
			return this.oMessageDialog;
		},
		/*Event to handle click of edit button of PR Item*/
		onPressEdit: function (oEvent) {
			this.isSupplierLengthExceeding = false;
			this.isDateValid = true;
			this.isQtyLengthExeeding = false;

			this.setEditModelData(oEvent);
			this.openDialog('editDialog'); // to open edit dialog
		},
		setEditModelData: function (oEvent) {
			var vPurchaserequisition = oEvent.getSource().getModel().getProperty('PurchaseRequisition', oEvent.getSource().getBindingContext());
			var vPurchaserequisitionitem = oEvent.getSource().getModel().getProperty('PurchaseRequisitionItem', oEvent.getSource().getBindingContext());
			var vSourcesOfSupplyCount = oEvent.getSource().getModel().getProperty('PurReqnSourceOfSupplyCount', oEvent.getSource().getBindingContext());
			var vQuantity = oEvent.getSource().getModel().getProperty('RequestedQuantity', oEvent.getSource().getBindingContext());
			var vDesiredSupplier = oEvent.getSource().getModel().getProperty('Supplier', oEvent.getSource().getBindingContext());
			var vDateOfDelivery = oEvent.getSource().getModel().getProperty('DeliveryDate', oEvent.getSource().getBindingContext());
			if (vDateOfDelivery === null || vDateOfDelivery === undefined) {
				vDateOfDelivery = new Date();
			}
			var vEndDate = oEvent.getSource().getModel().getProperty('PerformancePeriodEndDate', oEvent.getSource().getBindingContext());
			var vStartDate = oEvent.getSource().getModel().getProperty('PerformancePeriodStartDate', oEvent.getSource().getBindingContext());
			var vProductType = oEvent.getSource().getModel().getProperty('ProductType', oEvent.getSource().getBindingContext());
			var vQuantityMeasureUnit = oEvent.getSource().getModel().getProperty('BaseUnit', oEvent.getSource().getBindingContext());
			var sShortText = oEvent.getSource().getModel().getProperty('PurchaseRequisitionItemText', oEvent.getSource().getBindingContext());
			var vMaterialNumber = oEvent.getSource().getModel().getProperty('Material', oEvent.getSource().getBindingContext());
			var vPlant = oEvent.getSource().getModel().getProperty('Plant', oEvent.getSource().getBindingContext());
			var vFixedVendor = oEvent.getSource().getModel().getProperty('FixedSupplier', oEvent.getSource().getBindingContext());
			var vCurrency = oEvent.getSource().getModel().getProperty('PurReqnItemCurrency', oEvent.getSource().getBindingContext());
			var vInfoRecord = oEvent.getSource().getModel().getProperty('PurchasingInfoRecord', oEvent.getSource().getBindingContext());
			var vPurchasingDocCat = oEvent.getSource().getModel().getProperty('PurchasingDocumentItemCategory', oEvent.getSource().getBindingContext());
			var vPurchaseContract = oEvent.getSource().getModel().getProperty('PurchaseContract', oEvent.getSource().getBindingContext());
			var vPurchaseContractItem = oEvent.getSource().getModel().getProperty('PurchaseContractItem', oEvent.getSource().getBindingContext());
			var vRequisitionSourceOfSupplyType = oEvent.getSource().getModel().getProperty('PurReqnSourceOfSupplyType', oEvent.getSource().getBindingContext());
			var vAcctCat = oEvent.getSource().getModel().getProperty('AccountAssignmentCategory', oEvent.getSource().getBindingContext());
			var vConsumPost = oEvent.getSource().getModel().getProperty('ConsumptionPosting', oEvent.getSource().getBindingContext());
			var vMatrlGrp = oEvent.getSource().getModel().getProperty('MaterialGroup', oEvent.getSource().getBindingContext());
			var vPurchOrg = oEvent.getSource().getModel().getProperty('PurchasingOrganization', oEvent.getSource().getBindingContext());
			var oDataForEditModel = {
				'Purchaserequisition': vPurchaserequisition,
				'Purchaserequisitionitem': vPurchaserequisitionitem,
				'Sos_count': vSourcesOfSupplyCount,
				'Quantity': vQuantity,
				'Supplier': vDesiredSupplier,
				'Materialbaseunit': vQuantityMeasureUnit,
				'Deliverydate': vDateOfDelivery,
				'Purchaserequisitionitemtext': sShortText,
				'Upd_scenario': 'E',
				'Material': vMaterialNumber,
				'Plant': vPlant,
				'Fixedvendor': vFixedVendor,
				'Purchasinginforecord': vInfoRecord,
				'Purgdoctransactioncurrency': vCurrency,
				'PurchasingDocumentItemCategory': vPurchasingDocCat,
				'PurchaseContract': vPurchaseContract,
				'PurchaseContractItem': vPurchaseContractItem,
				'RequisitionSourceOfSupplyType': vRequisitionSourceOfSupplyType,
				'Acctassignmentcategory': vAcctCat,
				'Consumptionposting': vConsumPost,
				'Materialgroup': vMatrlGrp,
				'Purchasingorganization': vPurchOrg,
				'ProductType': vProductType,
				'PerformancePeriodStartDate': vStartDate,
				'PerformancePeriodEndDate': vEndDate
			}; //data for the edit fragment dialog box
			this.oModelEdit = new sap.ui.model.json.JSONModel(oDataForEditModel); // model created for edit fragment populated with oDataForEditModelvar itemkey = this.itemKey;
			// var sURLUpdatePR = "/C_Purchasereqitmdtlsext(PurchaseRequisition='" +
			// 			vPurchaserequisition + "',PurchaseRequisitionItem='" + vPurchaserequisitionitem + "')";
			// 	sap.ui.getCore().byId("idEditForm").bindElement(sURLUpdatePR);
		},
		openDialog: function (sFragmentType) { //same function used to open other fragment thus sFragmentType specifies which fragment is being called
			switch (sFragmentType) {
			case 'editDialog':
				{
					if (!this[sFragmentType]) {
						this[sFragmentType] = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.view.editDialog",
							this // associate controller with the fragment
						);
					}
					//this.oApplicationFacade.oApplicationImplementation.setModel(this.oModelEdit, 'ModelEditFragment');
					this[sFragmentType].setModel(this.oModelEdit);
					this.getView().addDependent(this[sFragmentType]);
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this[sFragmentType]);
					this[sFragmentType].open();
				}
			case 'SoSDialog':
				{
					if (!this[sFragmentType]) {
						this[sFragmentType] = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.view.SosDialog",
							this // associate controller with the fragment
						);
						this.getView().addDependent(this[sFragmentType]);
					}
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this[sFragmentType]);
					this[sFragmentType].open();
				}
			}
		},
		onEditDialogCloseButton: function (oEvent) {
			var oDP = sap.ui.getCore().byId("supplierF4multiInput");
			if (oDP.getValueState() === "Error") {
				oDP.setValueState(sap.ui.core.ValueState.None);
				oDP.setValueStateText("");
			}
			var dialog = sap.ui.getCore().byId("editDialog");
			dialog.close();
		},

		onStartDateChanged: function (oEvent) {
			this.bStartDateChanged = true;
			var sValue, bValid, oDP;
			if (oEvent === undefined) {
				oDP = sap.ui.getCore().byId("StartDate");
				sValue = oDP.getDateValue();
				bValid = true;
			} else {
				oDP = sap.ui.getCore().byId("StartDate");
				sValue = oDP.getDateValue();
			}
			if (sValue) {
				if (oEvent !== undefined)
					bValid = oEvent.getParameter("valid");
				this._iEvent++;
				var today = new Date();
				//	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				//		pattern: "dd/MM/yyyy"
				//	});
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				//              sap.ui.core.format.DateFormat.getInstance();
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({}, oLocale);
				if (bValid) {
					var StartDate = dateFormat.format(new Date(sValue));
					//					if (today < StartDate) {
					oDP.setValueState(sap.ui.core.ValueState.None);
					if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
						sap.ui.getCore().byId("idEditOk").setEnabled(true);
					}
					this.StartDate = sValue;
					//					} 
					// else { //when the current date is given as delivery date , this should be accepted
					// 	var currentDate = today.getDate();
					// 	currentDate = currentDate < 10 ? "0" + currentDate : currentDate;
					// 	var currentMonth = today.getMonth() + 1;
					// 	currentMonth = currentMonth < 10 ? "0" + currentMonth : currentMonth;
					// 	var currentFullDate = currentDate + "/" + currentMonth + "/" + today.getFullYear();
					// 	if (currentFullDate === sValue) {
					// 		oDP.setValueState(sap.ui.core.ValueState.None);
					// 		if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
					// 			sap.ui.getCore().byId("idEditOk").setEnabled(true);
					// 		}
					// 		this.StartDate = StartDate;
					// 	} else { //Start Date can be in past
					// 		oDP.setValueState(sap.ui.core.ValueState.None);
					// 		if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
					// 			sap.ui.getCore().byId("idEditOk").setEnabled(true);
					// 		}
					// 		this.StartDate = StartDate;
					// 		/*sap.ui.getCore().byId("idEditOk").setEnabled(false);
					// 		oDP.setValueState(sap.ui.core.ValueState.Error);
					// 		oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDateValid"));*/
					// 	}
					// }
					if (sap.ui.getCore().byId("idEditOk").getEnabled() === true && oEvent !== undefined) {
						this.onInputQuantityChanged();
					}
				} else {
					//Invalid Date entered manually
					oDP.setValueState(sap.ui.core.ValueState.Error);
					sap.ui.getCore().byId("idEditOk").setEnabled(false);
					oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDateValid"));
				}
			} else { //date is empty
				oDP.setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().byId("idEditOk").setEnabled(false);
				oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("EditMessage"));
			}
		},

		onEndDateChanged: function (oEvent) {
			this.bEndDateChanged = true;
			var sValue, bValid, oDP;
			if (oEvent === undefined) {
				oDP = sap.ui.getCore().byId("EndDate");
				sValue = oDP.getValue();
				bValid = true;
			} else {
				oDP = sap.ui.getCore().byId("EndDate");
				sValue = oDP.getDateValue();
			}
			if (sValue) {
				if (oEvent !== undefined)
					bValid = oEvent.getParameter("valid");
				this._iEvent++;
				var today = new Date();
				//	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				//		pattern: "dd/MM/yyyy"
				//	});
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				//              sap.ui.core.format.DateFormat.getInstance();
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({}, oLocale);
				if (bValid) {
					var EndDate = dateFormat.format(new Date(sValue));
					//					if (today < EndDate) {
					oDP.setValueState(sap.ui.core.ValueState.None);
					if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
						sap.ui.getCore().byId("idEditOk").setEnabled(true);
					}
					this.EndDate = sValue;
					//					} 
					// else { //when the current date is given as delivery date , this should be accepted
					// 	var currentDate = today.getDate();
					// 	currentDate = currentDate < 10 ? "0" + currentDate : currentDate;
					// 	var currentMonth = today.getMonth() + 1;
					// 	currentMonth = currentMonth < 10 ? "0" + currentMonth : currentMonth;
					// 	var currentFullDate = currentDate + "/" + currentMonth + "/" + today.getFullYear();
					// 	if (currentFullDate === sValue) {
					// 		oDP.setValueState(sap.ui.core.ValueState.None);
					// 		if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
					// 			sap.ui.getCore().byId("idEditOk").setEnabled(true);
					// 		}
					// 		this.EndDate = EndDate;
					// 	} else { //When delivery date is in the past the date is not accepted as valid date
					// 		/*	oDP.setValueState(sap.ui.core.ValueState.None);
					// 			sap.ui.getCore().byId("idEditOk").setEnabled(true);
					// 			this.EndDate = EndDate;*/
					// 		sap.ui.getCore().byId("idEditOk").setEnabled(false);
					// 		oDP.setValueState(sap.ui.core.ValueState.Error);
					// 		oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("EndDateValid"));
					// 	}
					// }
					if (sap.ui.getCore().byId("idEditOk").getEnabled() === true && oEvent !== undefined) {
						this.onInputQuantityChanged();
					}
				} else {
					//Invalid Date entered manually
					oDP.setValueState(sap.ui.core.ValueState.Error);
					sap.ui.getCore().byId("idEditOk").setEnabled(false);
					oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDateValid"));
				}
			} else { //date is empty
				oDP.setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().byId("idEditOk").setEnabled(false);
				oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("EditMessage"));
			}
		},

		onDateChanged: function (oEvent) {
			this.bDateChanged = true;
			var sValue, bValid, oDP;
			if (oEvent === undefined) {
				oDP = sap.ui.getCore().byId("Date");
				sValue = oDP.getDateValue();
				bValid = true;
			} else {
				oDP = sap.ui.getCore().byId("Date");
				sValue = oDP.getDateValue();
			}
			if (sValue) {
				if (oEvent !== undefined)
					bValid = oEvent.getParameter("valid");
				this._iEvent++;
				var today = new Date();
				//	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				//		pattern: "dd/MM/yyyy"
				//	});
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				//              sap.ui.core.format.DateFormat.getInstance();
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({}, oLocale);
				if (bValid) {
					this.isDateValid = true;
					var delivDate = dateFormat.format(new Date(sValue));
					//	if (today < delivDate) {
					oDP.setValueState(sap.ui.core.ValueState.None);
					if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
						sap.ui.getCore().byId("idEditOk").setEnabled(true);
					}
					this.deliverydate = sValue;
					//	} 
					// else { //when the current date is given as delivery date , this should be accepted
					// 	var currentDate = today.getDate();
					// 	currentDate = currentDate < 10 ? "0" + currentDate : currentDate;
					// 	var currentMonth = today.getMonth() + 1;
					// 	currentMonth = currentMonth < 10 ? "0" + currentMonth : currentMonth;
					// 	var currentFullDate = currentDate + "/" + currentMonth + "/" + today.getFullYear();
					// 	if (currentFullDate === sValue) {
					// 		oDP.setValueState(sap.ui.core.ValueState.None);
					// 		if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
					// 			sap.ui.getCore().byId("idEditOk").setEnabled(true);
					// 		}
					// 		this.deliverydate = delivDate;
					// 	} else { //When delivery date is in the past the date is not accepted as valid date
					// 		sap.ui.getCore().byId("idEditOk").setEnabled(false);
					// 		oDP.setValueState(sap.ui.core.ValueState.Error);
					// 		oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDateValid"));
					// 	}
					// }
					if (sap.ui.getCore().byId("idEditOk").getEnabled() === true && oEvent !== undefined) {
						this.onInputQuantityChanged();
					}
				} else {
					//Invalid Date entered manually
					this.isDateValid = false;
					oDP.setValueState(sap.ui.core.ValueState.Error);
					sap.ui.getCore().byId("idEditOk").setEnabled(false);
					oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("DelivDateValid"));
				}
			} else { //date is empty
				this.isDateValid = false;
				oDP.setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().byId("idEditOk").setEnabled(false);
				oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("EditMessage"));
			}
		},

		onInputQuantityChanged: function (oEvent) {
			var sValue, oDPQty;
			if (oEvent === undefined) {
				oDPQty = sap.ui.getCore().byId("idEditQuantity");
				sValue = oDPQty.getValue();
			} else {
				sValue = oEvent.getParameter("value");
				oDPQty = oEvent.getSource();
			}
			// if ( sValue.match(/^[0-9]+$/) === null) {
			// 		this.isQtyLengthExeeding = true;
			// 		sap.ui.getCore().byId("idEditOk").setEnabled(false);
			// 		oDPQty.setValueState(sap.ui.core.ValueState.Error);
			// 		oDPQty.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidQty"));
			// 		return;
			// }
			if (parseFloat(sValue) == sValue) {
				var number_to_array = sValue.split(".");
				if (number_to_array[0].length > 10 || number_to_array[0].match(/^[0-9]+$/) === null) {
					this.isQtyLengthExeeding = true;
					sap.ui.getCore().byId("idEditOk").setEnabled(false);
					oDPQty.setValueState(sap.ui.core.ValueState.Error);
					oDPQty.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidQty"));
					return;
				} else {
					this.isQtyLengthExeeding = false;
				}
				if (number_to_array[1] !== undefined) {
					if (number_to_array[1].length > 3) {
						sap.ui.getCore().byId("idEditOk").setEnabled(false);
						oDPQty.setValueState(sap.ui.core.ValueState.Error);
						oDPQty.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errValidQty"));
						return;
					}
				}
				oDPQty.setValueState(sap.ui.core.ValueState.None);
				if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
					sap.ui.getCore().byId("idEditOk").setEnabled(true);
				}
				if (oEvent !== undefined)
					this.onDateChanged();
			} else {
				sap.ui.getCore().byId("idEditOk").setEnabled(false);
				oDPQty.setValueState(sap.ui.core.ValueState.Error);
				oDPQty.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errMandatoryQty"));
			}
			this.isQtyLengthExeeding = false;
		},

		onChangeSupplier: function (oEvent) {

			var sUserEnteredSupplier = oEvent.getSource().getValue();
			var oDP = sap.ui.getCore().byId("supplierF4multiInput");
			if (sUserEnteredSupplier.length > 10) {
				sap.ui.getCore().byId("idEditOk").setEnabled(false);
				oDP.setValueState(sap.ui.core.ValueState.Error);
				oDP.setValueStateText(this.getOwnerComponent().getModel('i18n').getResourceBundle().getText("errSupplier"));
				this.isSupplierLengthExceeding = true;
				return;
			}
			this.isSupplierLengthExceeding = false;
			oDP.setValueState(sap.ui.core.ValueState.None);
			if (this.isSupplierLengthExceeding === false && this.isDateValid === true && this.isQtyLengthExeeding === false) {
				sap.ui.getCore().byId("idEditOk").setEnabled(true);
			}
			oEvent.getSource().getModel().getData().tempSupplier = sUserEnteredSupplier;

		},

		onSupplierValueHelpRequest: function (oEvent) {
			this.oResourceBundle = this.getResourceBundle();
			var oModelSoS = this.getModel();
			oModelSoS.read("/C_MM_SupplierValueHelp", {
				urlParameters: {},
				success: jQuery.proxy(this.getSupplierListSuccess, this),
				error: jQuery.proxy(this.getSupplierListFailure, this)
			});
		},
		getSupplierListSuccess: function (response) {
			var oInputFieldSupplier = sap.ui.getCore().byId("supplierF4multiInput");
			var supplierValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				title: this.oResourceBundle.getText("SUP"),
				modal: true,
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				key: "Supplier",
				descriptionKey: "SupplierName",
				ok: jQuery.proxy(function (oControlEvent) {
					var sUserEnteredSupplier = oInputFieldSupplier.setValue(oControlEvent.getParameter("tokens")[0].getKey());
					// oInputFieldSupplier.setTokens(oControlEvent.getParameter("tokens"));
					oInputFieldSupplier.getModel().getData().tempSupplier = sUserEnteredSupplier;
					oInputFieldSupplier.getModel().getData().FixedVendorSet = false;
					supplierValueHelpDialog.close();
					oInputFieldSupplier.fireChange();
				}, this),
				cancel: function (oControlEvent) {
					supplierValueHelpDialog.close();
				},
				afterClose: function () {
					supplierValueHelpDialog.destroy();
				}
			});
			supplierValueHelpDialog.setKey("Supplier");
			supplierValueHelpDialog.setKeys(["Supplier", "SupplierName"]);
			supplierValueHelpDialog.setRangeKeyFields([{
				label: this.oResourceBundle.getText("SID"),
				key: "Supplier"
			}, {
				label: this.oResourceBundle.getText("SNAME"),
				key: "SupplierName"
			}]);
			supplierValueHelpDialog.setTokens(oInputFieldSupplier.getTokens());
			var supplierF4ColModel = new sap.ui.model.json.JSONModel();
			supplierF4ColModel.setData({
				cols: [{
					label: this.oResourceBundle.getText("SID"),
					template: "Supplier"
				}, {
					label: this.oResourceBundle.getText("SNAME"),
					template: "SupplierName"
				}]
			});
			supplierValueHelpDialog.setModel(supplierF4ColModel, "columns");
			var supplierF4RowsModel = new sap.ui.model.json.JSONModel();
			supplierF4RowsModel.setData(response.results);
			supplierValueHelpDialog.setModel(supplierF4RowsModel);
			supplierValueHelpDialog.getTable().bindRows("/");
			if (oInputFieldSupplier.$()
				.closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
				supplierValueHelpDialog.addStyleClass("sapUiSizeCompact");
			}
			supplierValueHelpDialog.open();
			//Filter bar creation
			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				//		id: "F4SupplierDialog",
				advancedMode: true,
				filterBarExpanded: false,
				filterGroupItems: [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "SID",
						name: "S_ID",
						label: this.oResourceBundle.getText("SID"),
						control: new sap.m.Input()
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "SNAME",
						name: "S_NAME",
						label: this.oResourceBundle.getText("SNAME"),
						control: new sap.m.Input()
					})
				],
				search: function (oEvent) {
					var aSelectionSet = oEvent.getParameters().selectionSet;
					var oBinding = supplierValueHelpDialog.theTable.getBinding("rows");
					//            var oBinding = oEvent.getSource().getParent().getParent().getBinding("rows");
					var aFilterItems = [];
					var bAllFieldsEmpty = true;
					var oFilter = {};
					var aFilter = [];
					if (aSelectionSet[0].getValue() !== "") {
						var oFilterCode = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, aSelectionSet[0].getValue());
						aFilterItems.push(oFilterCode);
						bAllFieldsEmpty = false;
					}
					if (aSelectionSet[1].getValue() !== "") {
						var oFilterName = new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, aSelectionSet[1].getValue());
						aFilterItems.push(oFilterName);
						bAllFieldsEmpty = false;
					}
					if (sap.ui.getCore().byId("SupplierBasicSearch").getValue() !== "") {
						var oFilterCode = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, sap.ui.getCore().byId(
							"SupplierBasicSearch").getValue());
						aFilterItems.push(oFilterCode);
						var oFilterName = new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, sap.ui.getCore().byId(
							"SupplierBasicSearch").getValue());
						aFilterItems.push(oFilterName);
						bAllFieldsEmpty = false;
					}
					if (!bAllFieldsEmpty) {
						oFilter = new sap.ui.model.Filter(aFilterItems, false);
						aFilter.push(oFilter);
					}
					oBinding.filter(aFilter);
				}
			});

			//Check when the below condition is satisfied
			if (oFilterBar.setBasicSearch) {
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					showSearchButton: sap.ui.Device.system.phone,
					placeholder: "{i18n>SRCH}",
					id: "SupplierBasicSearch",
					search: function (event) {
						var supplierBasicSearchText = event.getSource().getValue();
						if (supplierBasicSearchText !== "") {
							var aFilterItems = [];
							var oFilter = {};
							var aFilter = [];
							var oBinding = supplierValueHelpDialog.theTable.getBinding("rows");
							var oFilterCode = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, supplierBasicSearchText);
							aFilterItems.push(oFilterCode);
							var oFilterName = new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, supplierBasicSearchText);
							aFilterItems.push(oFilterName);
							oFilter = new sap.ui.model.Filter(aFilterItems, false);
							aFilter.push(oFilter);
							oBinding.filter(aFilter);
						}
					}
				}));
			}
			supplierValueHelpDialog.setFilterBar(oFilterBar);
		},
		getSupplierListFailure: function () {
			// show error message box
		},

		handleSoSDialog: function (oEvent) {
			this.oEventSource = oEvent.getSource();
			this.SOSflag = false;
			var vMaterialNumber, vPlant, vQuantity, vPurchasingDocCat, vAcctCat,
				vConsumPost, vDeliveryDate,
				vPurDocType, vPurCatType, vMaterialGroup, vPurchasingOrg, vPurchasingSubType;
		//	this.matkl_ana = oEvent.getSource().getModel().getData().Materialgroup;
			this.idSourceSOSFgt = oEvent.getSource().getId();
			if (oEvent.getSource().getBindingContext() === undefined) //in case opened from edit fragment or item details screen
			{
				vMaterialNumber = oEvent.getSource().getModel().getData().Material;
				vPlant = oEvent.getSource().getModel().getData().Plant;
				vQuantity = oEvent.getSource().getModel().getData().Quantity;
				vPurchasingDocCat = oEvent.getSource().getModel().getData().Purchasingdocumentitemcategory;
				vPurDocType = oEvent.getSource().getModel().getData().Purchasingdocumenttype;
				vPurCatType = oEvent.getSource().getModel().getData().Purchasingdocumentcategory;
				vAcctCat = oEvent.getSource().getModel().getData().Acctassignmentcategory;
				vConsumPost = oEvent.getSource().getModel().getData().Consumptionposting;
				this.selectedPurReq = oEvent.getSource().getModel().getData().Purchaserequisition;
				this.selectedPurReqItem = oEvent.getSource().getModel().getData().Purchaserequisitionitem;
				this.selectedContract = oEvent.getSource().getModel().getData().PurchaseContract;
				this.selectedContractItem = oEvent.getSource().getModel().getData().PurchaseContractItem;
				this.selectedInforecord = oEvent.getSource().getModel().getData().Purchasinginforecord;
				vMaterialGroup = oEvent.getSource().getModel().getData().Materialgroup;
				vPurchasingOrg = oEvent.getSource().getModel().getData().Purchasingorganization;
				vPurchasingSubType = oEvent.getSource().getModel().getData().PurchasingDocumentSubType;
				vDeliveryDate = oEvent.getSource().getModel().getData().DeliveryDate;
				
				this.matkl_ana = oEvent.getSource().getModel().getData().Materialgroup;
				this.waers_ana = oEvent.getSource().getModel().getData().PurReqnItemCurrency;
				 

			} else // opened from edit fragment
			{
				vMaterialNumber = oEvent.getSource().getModel().getProperty('Material', oEvent.getSource().getBindingContext());
				vPlant = oEvent.getSource().getModel().getProperty('Plant', oEvent.getSource().getBindingContext());
				vQuantity = oEvent.getSource().getModel().getProperty('RequestedQuantity', oEvent.getSource().getBindingContext());
				vPurchasingDocCat = oEvent.getSource().getModel().getProperty('PurchasingDocumentItemCategory', oEvent.getSource().getBindingContext());
				vPurDocType = oEvent.getSource().getModel().getProperty('PurchaseRequisitionType', oEvent.getSource().getBindingContext());
				vPurCatType = oEvent.getSource().getModel().getProperty('PurchasingDocumentItemCategory', oEvent.getSource().getBindingContext());
				vAcctCat = oEvent.getSource().getModel().getProperty('AccountAssignmentCategory', oEvent.getSource().getBindingContext());
				vConsumPost = oEvent.getSource().getModel().getProperty('ConsumptionPosting', oEvent.getSource().getBindingContext());
				this.selectedPurReq = oEvent.getSource().getModel().getProperty('PurchaseRequisition', oEvent.getSource().getBindingContext());
				this.selectedPurReqItem = oEvent.getSource().getModel().getProperty('PurchaseRequisitionItem', oEvent.getSource().getBindingContext());
				this.selectedContract = oEvent.getSource().getModel().getProperty('PurchaseContract', oEvent.getSource().getBindingContext());
				this.selectedContractItem = oEvent.getSource().getModel().getProperty('PurchaseContractItem', oEvent.getSource().getBindingContext());
				this.selectedInforecord = oEvent.getSource().getModel().getProperty('PurchasingInfoRecord', oEvent.getSource().getBindingContext());
				vMaterialGroup = oEvent.getSource().getModel().getProperty('MaterialGroup', oEvent.getSource().getBindingContext());
				vPurchasingOrg = oEvent.getSource().getModel().getProperty('PurchasingOrganization', oEvent.getSource().getBindingContext());
				vPurchasingSubType = oEvent.getSource().getModel().getProperty('PurchasingDocumentSubtype', oEvent.getSource().getBindingContext());
				vDeliveryDate = oEvent.getSource().getModel().getProperty('DeliveryDate', oEvent.getSource().getBindingContext());
				this.prItemBindingContext = oEvent.getSource().getBindingContext();
				
				this.matkl_ana = oEvent.getSource().getModel().getProperty('MaterialGroup', oEvent.getSource().getBindingContext());
				this.waers_ana = oEvent.getSource().getModel().getProperty('PurReqnItemCurrency', oEvent.getSource().getBindingContext());	
			}
			//If these values are undefined, it was being passed as 'u' to the backend and would result in different SOS.
			if (vPurDocType === undefined) {
				vPurDocType = "";
			}
			if (vPurCatType === undefined) {
				vPurCatType = "";
			}
			if (vAcctCat === undefined) {
				vAcctCat = "";
			}
			if (vPurchasingSubType === undefined) {
				vPurchasingSubType = "";
			}
			if (vPlant === undefined) {
				vPlant = "";
			}
			if (vPurchasingOrg === undefined) {
				vPurchasingOrg = "";
			}
			if (vMaterialGroup === undefined) {
				vMaterialGroup = "";
			}
			if (vMaterialNumber === undefined) {
				vMaterialNumber = "";
			}
			if (vConsumPost === undefined) {
				vConsumPost = "";
			}
			var oModelSoS = this.getModel(); // main PR List model
			if (vQuantity.split) {
				var aQuanSplit = vQuantity.split('.');
			} else {
				vQuantity = "'" + vQuantity + "'";
				var aQuanSplit = vQuantity.split('.');
				this.openDialog('SoSDialog');
			}
			vQuantity = aQuanSplit[0];
			if (vPurCatType === undefined) {
				vPurCatType = "";
			}
			if (vPurDocType === undefined) {
				vPurDocType = "";
			}
			oModelSoS.read("/SourceOfSupplySet", {
				urlParameters: {
					"$filter": "BANFN eq '" + this.selectedPurReq + "' and BNFPO eq '" + this.selectedPurReqItem + "'"
				},
				success: jQuery.proxy(this.sosReadSuccess, this),
				error: jQuery.proxy(this.sosReadFailure, this)
			});

		},
		sosReadSuccess: function (data, response) {
			var iIndexSelected = -1;
			for (var i = 0; i < data.results.length; i++) {
				data.results[i].Supplier = data.results[i].LIFNR + ':' + data.results[i].NAME + ':' + data.results[i].INFNR + ':' + data.results[
						i]
					.EBELN;
				if (this.selectedContract !== '') {
					if (this.selectedContract === data.results[i].EBELN && this.selectedContractItem === data.results[i].EBELP) {
						iIndexSelected = i;
					}
				}
				if (this.selectedInforecord !== '') {
					if (this.selectedInforecord === data.results[i].INFNR) {
						iIndexSelected = i;
					}
				}
			}
			var oJSSrcSupply = {
				'SourceOfSupplySet': data.results
			}; // results fetched through readstored in results
			if (!this['SoSDialog']) {
				this['SoSDialog'] = sap.ui.xmlfragment("ui.ssuite.s2p.mm.pur.pr.prcss.s1.view.SosDialog",
					this // associate controller with the fragment
				);
				this.getView().addDependent(this.SoSDialog);
			}
			this.sosShowContent(oJSSrcSupply, iIndexSelected);

			//this['SoSDialog'].setModel(new sap.ui.model.json.JSONModel(oJSSrcSupply));

			this.openDialog('SoSDialog');
			/*	var sAggr = 'mAggregations';
				this['SoSDialog']._table[sAggr].items = null;*/
			//	this['SoSDialog'].setModel(new sap.ui.model.json.JSONModel(oJSSrcSupply)); //model set for Sos fragment
			// var list = sap.ui.getCore().byId("idList");
			// if (iIndexSelected !== -1) { //to show the value that has been selcted previously as fixed vendor for the same
			// 	list.getItems()[iIndexSelected].setSelected(true);
			// }

		},
		sosShowContent: function (oData, iIndexSelected) {
			var dialogHeaderToolbar = this.SoSDialog.getCustomHeader().getContent();
			var tableButton = dialogHeaderToolbar[3];
			// var chartButton = dialogHeaderToolbar[4];

			if (tableButton.getPressed()) {
				this.SoSDialog.getContent()[0].getItems()[0].setVisible(true);
				this.SoSDialog.getContent()[0].getItems()[1].setVisible(true);
				this.SoSDialog.getContent()[0].getItems()[2].setVisible(false);
			} else {
				this.SoSDialog.getContent()[0].getItems()[0].setVisible(false);
				this.SoSDialog.getContent()[0].getItems()[1].setVisible(false);
				this.SoSDialog.getContent()[0].getItems()[2].setVisible(true);
			}
			this.SourceOfSupplyData = oData;
			this.SoSDialog.setModel(new sap.ui.model.json.JSONModel(oData));
			var list = sap.ui.getCore().byId("idList");
			if (iIndexSelected !== -1) { //to show the value that has been selcted previously as fixed vendor for the same
				list.getItems()[iIndexSelected].setSelected(true);
			}
			// var oVizModel = new sap.ui.model.json.JSONModel();
			// oVizModel.setData({
			// 	SourceOfSupplySet: oData.SourceOfSupplySet
			// });
			// var oVizDataSet = new sap.viz.ui5.data.FlattenedDataset({
			// 	dimensions: [{
			// 		name: "Supplier",
			// 		value: "{Supplier}"
			// 	}, {
			// 		name: "CalendarMonth",
			// 		value: "{CalendarMonth}"
			// 	}],
			// 	measures: [{
			// 		name: "Score",
			// 		value: "{Score}"
			// 	}, {
			// 		name: "NETPR",
			// 		value: "{NETPR}"
			// 	}, {
			// 		name: "TotalSpend",
			// 		value: "{TotalSpend}"
			// 	}],
			// 	data: {
			// 		path: "/SourceOfSupplySet"
			// 	}
			// });
			// this.SoSDialog.getContent()[0].getItems()[2].setModel(oVizModel);
			// this.SoSDialog.getContent()[0].getItems()[2].setDataset(oVizDataSet);

			// // var selectParameters = "LIFNR,TotalSpend,NETPR,Score,EBELN";
			// // this.SoSDialog.getContent()[0].getItems()[1].getDataset().bindData({
			// // 	path: "/SourceOfSupplySet",
			// // 	parameters: {
			// // 		select: selectParameters
			// // 	}
			// // });
			// var CategoryAxisText = this.getView().getModel("i18n").getProperty("PerUnitPrice");
			// var ValueAxisText = this.getView().getModel("i18n").getProperty("SupplierScore");
			// var legendText = this.getView().getModel("i18n").getProperty("SOS");
			// var sizeLegendText = this.getView().getModel("i18n").getProperty("TotalSpend");
			// this.SoSDialog.getContent()[0].getItems()[2].setVizProperties({
			// 	valueAxis: {
			// 		title: {
			// 			text: ValueAxisText,
			// 			visible: true
			// 		}
			// 	},
			// 	valueAxis2: {
			// 		title: {
			// 			text: CategoryAxisText,
			// 			visible: true
			// 		}
			// 	},
			// 	legend: {
			// 		title: {
			// 			text: legendText,
			// 			visible: true
			// 		}
			// 	},
			// 	sizeLegend: {
			// 		title: {
			// 			text: sizeLegendText,
			// 			visible: true
			// 		}
			// 	},
			// 	plotArea: {
			// 		dataLabel: {
			// 			visible: true,
			// 			hideWhenOverlap: false,
			// 			respectShapeWidth: true
			// 		}
			// 	}
			// });
		},
		
		fillSOSDataSuccess : function(oData){
			this.SOSflag = true;
			var SupplierScoreData = oData.results;
			var SOSData = this.SourceOfSupplyData.SourceOfSupplySet ;
			for (var i = 0; i < SupplierScoreData.length; i++) {
				    for (var j = 0; j < SOSData.length; j++) {
				        if (SOSData[j].LIFNR === SupplierScoreData[i].LIFNR) {
				            SOSData[j].SCORE = SupplierScoreData[i].SCORE ;
				        }
				    }
				}
			
			var oVizModel = new sap.ui.model.json.JSONModel();
			oVizModel.setData({
				SourceOfSupplySet: SOSData
			});
			var oVizDataSet = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "Supplier",
					value: "{Supplier}"
				}, {
					name: "CalendarMonth",
					value: "{CalendarMonth}"
				}],
				measures: [{
					name: "Score",
					value: "{Score}"
				}, {
					name: "NETPR",
					value: "{NETPR}"
				}, {
					name: "TotalSpend",
					value: "{TotalSpend}"
				}],
				data: {
					path: "/SourceOfSupplySet"
				}
			});
			this.SoSDialog.getContent()[0].getItems()[2].setModel(oVizModel);
			this.SoSDialog.getContent()[0].getItems()[2].setDataset(oVizDataSet);

			
			var CategoryAxisText = this.getView().getModel("i18n").getProperty("PerUnitPrice");
			var ValueAxisText = this.getView().getModel("i18n").getProperty("SupplierScore");
			var legendText = this.getView().getModel("i18n").getProperty("SOS");
			var sizeLegendText = this.getView().getModel("i18n").getProperty("TotalSpend");
			this.SoSDialog.getContent()[0].getItems()[2].setVizProperties({
				valueAxis: {
					title: {
						text: ValueAxisText,
						visible: true
					}
				},
				valueAxis2: {
					title: {
						text: CategoryAxisText,
						visible: true
					}
				},
				legend: {
					title: {
						text: legendText,
						visible: true
					}
				},
				sizeLegend: {
					title: {
						text: sizeLegendText,
						visible: true
					}
				},
				plotArea: {
					dataLabel: {
						visible: true,
						hideWhenOverlap: false,
						respectShapeWidth: true
					}
				}
			});
			
			
		},
		fillSOSDataFailure : function(oData){
			this.SOSflag = false ;
		},
		onPressSwitchTable: function (oEvent) {
			this.SoSDialog.getContent()[0].getItems()[0].setVisible(true);
			this.SoSDialog.getContent()[0].getItems()[1].setVisible(true);
			this.SoSDialog.getContent()[0].getItems()[2].setVisible(false);
			this.SoSDialog.getCustomHeader().getContent()[3].setPressed(true);
			this.SoSDialog.getCustomHeader().getContent()[4].setPressed(false);
			this.SoSDialog.getCustomHeader().getContent()[5].setVisible(false);
		},
		onPressSwitchChart: function (oEvent) {
			this.SoSDialog.getContent()[0].getItems()[0].setVisible(false);
			this.SoSDialog.getContent()[0].getItems()[1].setVisible(false);
			this.SoSDialog.getContent()[0].getItems()[2].setVisible(true);
			this.SoSDialog.getCustomHeader().getContent()[3].setPressed(false);
			this.SoSDialog.getCustomHeader().getContent()[4].setPressed(true);
			this.SoSDialog.getCustomHeader().getContent()[5].setVisible(false); //legend toggle not yet supported
			
			this.ScoreRequested = 'X' ;
			
			var filter =  "BANFN eq '" + this.selectedPurReq + "' and BNFPO eq '" + this.selectedPurReqItem + 
						  "' and MATKL eq '" + this.matkl_ana + "' and WAERS eq '" + this.waers_ana + "' and ScoreRequested eq '" + this.ScoreRequested +  "'";
			if (this.SOSflag === false){
				this.getModel().read("/SourceOfSupplySet", {
				urlParameters: {
					"$filter": filter,
					"$select" : "LIFNR,Score" 
				},
				success: jQuery.proxy(this.fillSOSDataSuccess, this),
				error: jQuery.proxy(this.fillSOSDataFailure, this)
				});
			}
		},
		onPressLegendEnable: function (oEvent) {
			var legendToggle = oEvent.getSource();
			if (legendToggle.getPressed()) {
				this.SoSDialog.getContent()[0].getItems()[2].setLegendVisible(true);
			} else {
				this.SoSDialog.getContent()[0].getItems()[2].setLegendVisible(false);
			}
		},
		onTableSelect: function (oEvent) {
			var oSelectedObject = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
			this.onSosConfirm(oSelectedObject);
			this.SoSDialog.close();
		},
		onChartSelect: function (oEvent) {
			var oSelectedChartObject = oEvent.getParameters().data[0].data;
			var oSelectedObject = {};
			var SoSData = this.SourceOfSupplyData.SourceOfSupplySet;
			var aSelectedObject = oSelectedChartObject.Supplier.split(":");
			for (var i = 0; i < SoSData.length; i++) {
				if (SoSData[i].LIFNR === aSelectedObject[0] && (SoSData[i].EBELN === aSelectedObject[2] || SoSData[i].INFNR === aSelectedObject[2])) {
					oSelectedObject = SoSData[i];
					break;
				}
			}
			this.onSosConfirm(oSelectedObject);
			this.SoSDialog.close();
		},
		handleClose: function () {
			this.SOSflag = false;
			this.SoSDialog.getContent()[0].getItems()[0].setVisible(true);
			this.SoSDialog.getContent()[0].getItems()[1].setVisible(true);
			this.SoSDialog.getContent()[0].getItems()[2].setVisible(false);
			this.SoSDialog.getCustomHeader().getContent()[3].setPressed(true);
			this.SoSDialog.getCustomHeader().getContent()[4].setPressed(false);
			this.SoSDialog.getCustomHeader().getContent()[5].setVisible(false);
			var vSosSearch = sap.ui.getCore().byId("idSoSSearch");
			vSosSearch.setValue("");
			this.SoSDialog.close();
		},
		sosReadFailure: function () {

		},
		onSoSSearch: function (oEvt) {
			// add filter for search in SoS fragment
			var aFilters = [];
			var sQuery = oEvt.getParameter('query');
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("Supplier",
					sap.ui.model.FilterOperator.Contains,
					sQuery);
				aFilters.push(filter);
			}
			// update list binding
			var list = sap.ui.getCore().byId("idList");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		onSosConfirm: function (oSelectedObject) {
			var vsupplier = oSelectedObject.LIFNR;
			var vInfoRecord = oSelectedObject.INFNR;
			var vCurrency = oSelectedObject.WAERS;
			var vContract = oSelectedObject.EBELN;
			var vSosType = oSelectedObject.VRTYP;
			var vContractItem = oSelectedObject.EBELP;
			var vDocumentType = oSelectedObject.BSART;
			var vPurchasingOrg = oSelectedObject.EKORG;
			if (this['editDialog']) {
				var oModelEditFgt = this['editDialog'].getModel();
			}
			var oPayloadForSoSUpdate = {};
			if (this.idSourceSOSFgt === "linkSOSEditFgt") // opened from edit fragment
			{
				oModelEditFgt.getData().Fixedvendor = vsupplier; // updating supplier of model data
				oModelEditFgt.getData().Purchasinginforecord = vInfoRecord;
				oModelEditFgt.getData().Purgdoctransactioncurrency = vCurrency;
				oModelEditFgt.getData().PurchaseContract = vContract;
				oModelEditFgt.getData().PurchaseContractItem = vContractItem;
				oModelEditFgt.getData().RequisitionSourceOfSupplyType = vSosType;
				oModelEditFgt.getData().Purchasingorganization = vPurchasingOrg;
				oModelEditFgt.getData().FixedVendorSet = true;
				oModelEditFgt.getData().Supplier = '';
				this['editDialog'].setModel(oModelEditFgt);
				oModelEditFgt.refresh(); // refresh the data on UI
			} else {
				var prWLModel = this.getModel();
				oPayloadForSoSUpdate.RequestedQuantity = prWLModel.getProperty('RequestedQuantity', this.prItemBindingContext);
				oPayloadForSoSUpdate.BaseUnit = prWLModel.getProperty('BaseUnit', this.prItemBindingContext);
				oPayloadForSoSUpdate.DeliveryDate = prWLModel.getProperty('DeliveryDate', this.prItemBindingContext);
				oPayloadForSoSUpdate.PurchaseRequisitionItemText = prWLModel.getProperty('PurchaseRequisitionItemText', this.prItemBindingContext);
				oPayloadForSoSUpdate.Material = prWLModel.getProperty('Material', this.prItemBindingContext);
				oPayloadForSoSUpdate.Plant = prWLModel.getProperty('Plant', this.prItemBindingContext);
				oPayloadForSoSUpdate.PurchasingDocumentItemCategory = prWLModel.getProperty('PurchasingDocumentItemCategory', this.prItemBindingContext);
				oPayloadForSoSUpdate.MaterialGroup = prWLModel.getProperty('MaterialGroup', this.prItemBindingContext);
				oPayloadForSoSUpdate.PurchasingOrganization = prWLModel.getProperty('PurchasingOrganization', this.prItemBindingContext);

				if (vDocumentType === 'RV') {
					oPayloadForSoSUpdate.PurchaseRequisition = this.selectedPurReq;
					oPayloadForSoSUpdate.PurchaseRequisitionItem = this.selectedPurReqItem;
					oPayloadForSoSUpdate.FixedSupplier = '';
					oPayloadForSoSUpdate.PurchasingInfoRecord = '';
					oPayloadForSoSUpdate.PurReqnItemCurrency = vCurrency;
					oPayloadForSoSUpdate.PurchaseContract = '';
					oPayloadForSoSUpdate.PurchaseContractItem = '';
					oPayloadForSoSUpdate.PurReqnSourceOfSupplyType = '';
					oPayloadForSoSUpdate.Supplier = vsupplier;

				} else {
					oPayloadForSoSUpdate.PurchaseRequisition = this.selectedPurReq;
					oPayloadForSoSUpdate.PurchaseRequisitionItem = this.selectedPurReqItem;
					oPayloadForSoSUpdate.FixedSupplier = vsupplier;
					oPayloadForSoSUpdate.PurchasingInfoRecord = vInfoRecord;
					oPayloadForSoSUpdate.PurchasingOrganization = vPurchasingOrg;
					oPayloadForSoSUpdate.PurReqnItemCurrency = vCurrency;
					oPayloadForSoSUpdate.PurchaseContract = vContract;
					oPayloadForSoSUpdate.PurchaseContractItem = vContractItem;
					oPayloadForSoSUpdate.PurReqnSourceOfSupplyType = vSosType;
					oPayloadForSoSUpdate.Supplier = '';
				}
				//When there is no response, the message is saved in the message manager. but this should be the messages from the previous action(e.g creation of PO)
				var msgMgr = sap.ui.getCore().getMessageManager();
				msgMgr.removeAllMessages();

				var sURLUpdatePR = "/C_Purchasereqitmdtlsext(PurchaseRequisition='" +
					oPayloadForSoSUpdate.PurchaseRequisition + "',PurchaseRequisitionItem='" + oPayloadForSoSUpdate.PurchaseRequisitionItem + "')";
				var oModelForPRList = this.getModel();
				oModelForPRList.setRefreshAfterChange(false);
				if (oPayloadForSoSUpdate.tempSupplier !== undefined || oPayloadForSoSUpdate.tempSupplier !== null) {
					delete oPayloadForSoSUpdate.tempSupplier;
				}
				oModelForPRList.update(sURLUpdatePR, oPayloadForSoSUpdate, {
					success: jQuery.proxy(this.sosUpdtSuccessHdlr, this),
					error: jQuery.proxy(this.sosUpdtErrorHdlr, this)
				});
			}
		},
		sosUpdtSuccessHdlr: function (data, response) {
			this.CreateButtonsEnableCheckPostUpdate();
			var aEditErrMessage = new Array();
			var oMessagePopup;
			var vNavFlag = false;
			var bIsRfq = true;
			var aErrMessage;
			if (response && response.headers['sap-message']) {
				var msgDetails = JSON.parse(response.headers['sap-message']).details;
				var message = JSON.parse(response.headers['sap-message']);

				var aEdtErrMessage = {
					name: message.message,
					state: this._getMessageState(message.severity),
					icon: this._getMessageIcon(message.severity)
				};
				aEditErrMessage.push(aEdtErrMessage);
				//var msgMgr = sap.ui.getCore().getMessageManager();
				//var messages = msgMgr.getMessageModel().getData();
				for (var iMsgCount = 0; iMsgCount < msgDetails.length; iMsgCount++) {
					aErrMessage = {
						name: msgDetails[iMsgCount].message,
						state: this._getMessageState(msgDetails[iMsgCount].severity),
						icon: this._getMessageIcon(msgDetails[iMsgCount].severity)
					};
					aEditErrMessage.push(aErrMessage);
				}
			}
			if (aEditErrMessage.length > 0) {
				oMessagePopup = this._getMessagePopup(aEditErrMessage, vNavFlag, bIsRfq);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("SoSSucsess"));
			}
			this.getModel().refresh();

		},
		sosUpdtErrorHdlr: function (data, response) {
			var error = "";
			// var oError = JSON.parse(oErrorUpdate.response.body).error;
			// error += oError.message.value;
			//Uncomment if you want to display the all the errors coming from backend                    
			/*           for (var errorCnt=0; errorCnt < oError.innererror.errordetails.length-1; errorCnt++) {
                                                                                                                                if (errorCnt==0) {
                                                                                                                                                error+="\n\n";
                                                                                                                                                error+="Details:\n";
                                                                                                                                }
                                                                                                                                if (oError.innererror.errordetails[errorCnt].code!="/IWBEP/CX_MGW_BUSI_EXCEPTION") {
                                                                                                                                                //error+="\n";
                                                                                                                                                error+=oError.innererror.errordetails[errorCnt].message;
                                                                                                                                                if (errorCnt < (oError.innererror.errordetails.length-1)) {
                                                                                                                                                                error+="\n";
                                                                                                                                                }
                                                                                                                                }
                                                                                                                }*/
			sap.m.MessageBox.error(error);
			/*	sap.ca.ui.message
					.showMessageBox({
						type: sap.ca.ui.message.Type.ERROR,
						message: error,
					}, null);*/
		},
		CreateButtonsEnableCheckPostUpdate: function () {
			var oSelectedItems = this.byId("idPRItemTable").getSelectedContexts();
			var iItems, oData, bEnabledPO, bEnabledRFQ, bEnabledCTR;
			if (oSelectedItems.length === 0) // atleast one item should be selected
			{
				bEnabledPO = false;
				bEnabledRFQ = false;
				bEnabledCTR = false;
			} else {
				for (iItems = 0; iItems < oSelectedItems.length; iItems++) {
					oData = oSelectedItems[iItems].getProperty(oSelectedItems[iItems].getPath()); // selected item should have a SoS selected
					//	if (oData.Purchaserequisition !== Purchaserequisition && //skipping the PR for which the SOS was assigned
					//		oData.Purchaserequisitionitem !== Purchaserequisitionitem) {
					if ((oData.FixedSupplier === null || oData.FixedSupplier === undefined || oData.FixedSupplier === "") &&
						(oData.Supplier === null || oData.Supplier === undefined || oData.Supplier === "")) {
						bEnabledPO = false;
						break;
					} else if (oData.OrderedQuantity >= oData.RequestedQuantity) {
						bEnabledPO = false;
						bEnabledRFQ = false;
						bEnabledCTR = false;
						break;
					} else {
						bEnabledPO = true;
						bEnabledCTR = true;
						if (this.RFQFlag === true) {
							bEnabledRFQ = true;
						}
					}
				}
			}
			this.byId("CreatePO").setEnabled(bEnabledPO);
			this.byId("CreateRFQ").setEnabled(bEnabledRFQ);
			this.byId("CreateCTR").setEnabled(bEnabledCTR);
		},

		onDialogOkButton: function (oEvent) {
			//focus has to be shifted for update in iPad
			oEvent.getSource().focus();
			var oModelForPRList = this.getModel(); // main PR List model
			oModelForPRList.setRefreshAfterChange(false);
			var oPayloadForUpdatePR = oEvent.getSource().getModel().getData(); // getting updated data from edit fragment
			var userEnteredVendor = sap.ui.getCore().byId('supplierF4multiInput').getValue();
			if (oEvent.getSource().getModel().getData().tempSupplier) {
				oEvent.getSource().getModel().getData().Supplier = oEvent.getSource().getModel().getData().tempSupplier;
				delete oEvent.getSource().getModel().getData().tempSupplier;
				oEvent.getSource().getModel().getData().Fixedvendor = '';
				oEvent.getSource().getModel().getData().Purchasinginforecord = '';
				oEvent.getSource().getModel().getData().PurchaseContract = '';
				oEvent.getSource().getModel().getData().PurchaseContractItem = '';
				oEvent.getSource().getModel().getData().RequisitionSourceOfSupplyType = '';
			}
			/*if (oPayloadForUpdatePR.Deliverydate === "" || oPayloadForUpdatePR.Deliverydate === undefined ||
				oPayloadForUpdatePR.Deliverydate === null)*/
			if ((oPayloadForUpdatePR.Deliverydate === "" || oPayloadForUpdatePR.Deliverydate === undefined ||
					oPayloadForUpdatePR.Deliverydate === null) && (this.bDateChanged != true && (this.deliverydate != "" || this.deliverydate !=
					undefined || this.deliverydate != null)) && (oEvent.getSource().getModel().getData().PurchasingDocumentItemCategory !== 'A')) // delivery date is required field
			{
				this.oResourceBundle = this.getResourceBundle();
				var mandatoryMsg = this.oResourceBundle.getText("EditMessage");
				sap.m.MessageBox.error(mandatoryMsg);
			} else if (oPayloadForUpdatePR.Quantity === "" || oPayloadForUpdatePR.Quantity === "NaN" || oPayloadForUpdatePR.Quantity ===
				undefined ||
				oPayloadForUpdatePR.Quantity < 0 || oPayloadForUpdatePR.Quantity === 0 || oPayloadForUpdatePR.Quantity === "0"
				&& oEvent.getSource().getModel().getData().PurchasingDocumentItemCategory !== 'A') // Quantity is required field
			{
				this.oResourceBundle = this.getResourceBundle();
				var mandatoryqtyMsg = this.oResourceBundle.getText("MandatoryQuantity");
				sap.m.MessageBox.error(mandatoryqtyMsg);
			} else {
				if (this.bDateChanged) {
					this._iEvent = 0;
					var oDeliveryDate = new Date(this.deliverydate);
					oDeliveryDate.setDate(oDeliveryDate.getDate() + 1);
					oPayloadForUpdatePR.Deliverydate = oDeliveryDate;
				}
				if (this.bEndDateChanged) {
					this._iEvent = 0;
					var oEndDate = new Date(this.EndDate);
					oEndDate.setDate(oEndDate.getDate() + 1);
					oPayloadForUpdatePR.PerformancePeriodEndDate = oEndDate;
				}
				if (this.bStartDateChanged) {
					this._iEvent = 0;
					var oStartDate = new Date(this.StartDate);
					oStartDate.setDate(oStartDate.getDate() + 1);
					oPayloadForUpdatePR.PerformancePeriodStartDate = oStartDate;
				}
				if (!oPayloadForUpdatePR.FixedVendorSet) {
					if (userEnteredVendor === "Supplier") // code not required as 'Supplier' mentioned as placeholder text and not watermark
					{
						oPayloadForUpdatePR.Fixedvendor = "";
						oPayloadForUpdatePR.Supplier = ""; // set to blank if sos not selected. (else default "Supplier" would get updated in backend.
					} // set to blank if sos not selected. (else default "Supplier" would get updated in backend.
					else {
						oPayloadForUpdatePR.Fixedvendor = userEnteredVendor;
					}
				}
				if (oPayloadForUpdatePR.FixedVendorSet) {
					delete oPayloadForUpdatePR.FixedVendorSet;
				}
				//When there is no response, the message is saved in the message manager. but this should be the messages from the previous action(e.g creation of PO)
				var msgMgr = sap.ui.getCore().getMessageManager();
				msgMgr.removeAllMessages();

				var sURLUpdatePR = "/C_Purchasereqitmdtlsext(PurchaseRequisition='" +
					oPayloadForUpdatePR.Purchaserequisition + "',PurchaseRequisitionItem='" + oPayloadForUpdatePR.Purchaserequisitionitem + "')"; //URL for calling update
				if (oPayloadForUpdatePR.tempSupplier !== undefined || oPayloadForUpdatePR.tempSupplier !== null) {
					delete oPayloadForUpdatePR.tempSupplier;
				}
				var oPayloadForUpdtPR = {};
				oPayloadForUpdtPR.PurchaseRequisition = oPayloadForUpdatePR.Purchaserequisition;
				oPayloadForUpdtPR.PurchaseRequisitionItem = oPayloadForUpdatePR.Purchaserequisitionitem;
				oPayloadForUpdtPR.RequestedQuantity = oPayloadForUpdatePR.Quantity;
				//oPayloadForUpdtPR.Supplier = oPayloadForUpdatePR.Supplier;
				oPayloadForUpdtPR.BaseUnit = oPayloadForUpdatePR.Materialbaseunit;
				oPayloadForUpdtPR.DeliveryDate = oPayloadForUpdatePR.Deliverydate;
				oPayloadForUpdtPR.PurchaseRequisitionItemText = oPayloadForUpdatePR.Purchaserequisitionitemtext;
				oPayloadForUpdtPR.PerformancePeriodEndDate = oPayloadForUpdatePR.PerformancePeriodEndDate;
				oPayloadForUpdtPR.PerformancePeriodStartDate = oPayloadForUpdatePR.PerformancePeriodStartDate;
				//oPayloadForUpdtPR. = oPayloadForUpdatePR.Upd_scenario;
				oPayloadForUpdtPR.Material = oPayloadForUpdatePR.Material;
				oPayloadForUpdtPR.Plant = oPayloadForUpdatePR.Plant;
				oPayloadForUpdtPR.FixedSupplier = oPayloadForUpdatePR.Fixedvendor;
				oPayloadForUpdtPR.PurchasingInfoRecord = oPayloadForUpdatePR.Purchasinginforecord;
				oPayloadForUpdtPR.PurReqnItemCurrency = oPayloadForUpdatePR.Purgdoctransactioncurrency;
				oPayloadForUpdtPR.PurchaseRequisitionPrice = oPayloadForUpdatePR.Materialcomponentprice;
				oPayloadForUpdtPR.PurchasingDocumentItemCategory = oPayloadForUpdatePR.Purchasingdocumentitemcategory;
				oPayloadForUpdtPR.PurchaseContract = oPayloadForUpdatePR.PurchaseContract;
				oPayloadForUpdtPR.PurchaseContractItem = oPayloadForUpdatePR.PurchaseContractItem;
				oPayloadForUpdtPR.PurReqnSourceOfSupplyType = oPayloadForUpdatePR.RequisitionSourceOfSupplyType;
				oPayloadForUpdtPR.AccountAssignmentCategory = oPayloadForUpdatePR.Acctassignmentcategory;
				oPayloadForUpdtPR.ConsumptionPosting = oPayloadForUpdatePR.Consumptionposting;
				oPayloadForUpdtPR.MaterialGroup = oPayloadForUpdatePR.Materialgroup;
				oPayloadForUpdtPR.PurchasingOrganization = oPayloadForUpdatePR.Purchasingorganization;

				oModelForPRList.update(sURLUpdatePR, oPayloadForUpdtPR, {
					success: jQuery.proxy(this.UpdtSuccessHdlr, this),
					error: jQuery.proxy(this.UpdtErrorHdlr, this)
				});
				oEvent.getSource().getParent().close();
			}
			this.bDateChanged = false;
			this.bEndDateChanged = false;
			this.bStartDateChanged = false;
		},
		UpdtSuccessHdlr: function (response) {
			//function for success
			//create PO button enable check
			this.CreateButtonsEnableCheckPostUpdate();

			var aEditErrMessage = new Array();
			var oMessagePopup;
			var vNavFlag = false;
			var bIsRfq = true;
			var aErrMessage;
			if (response && response.headers['sap-message']) {
				var msgDetails = JSON.parse(response.headers['sap-message']).details;
				var message = JSON.parse(response.headers['sap-message']);

				var aEdtErrMessage = {
					name: message.message,
					state: this._getMessageState(message.severity),
					icon: this._getMessageIcon(message.severity)
				};
				aEditErrMessage.push(aEdtErrMessage);
				//var msgMgr = sap.ui.getCore().getMessageManager();
				//var messages = msgMgr.getMessageModel().getData();
				for (var iMsgCount = 0; iMsgCount < msgDetails.length; iMsgCount++) {
					aErrMessage = {
						name: msgDetails[iMsgCount].message,
						state: this._getMessageState(msgDetails[iMsgCount].severity),
						icon: this._getMessageIcon(msgDetails[iMsgCount].severity)
					};
					aEditErrMessage.push(aErrMessage);
				}
			} else {
				var msgMgr = sap.ui.getCore().getMessageManager();
				var messages = msgMgr.getMessageModel().getData();
				for (var iMsgCnt = 0; iMsgCnt < messages.length; iMsgCnt++) {
					aErrMessage = {
						name: messages[iMsgCnt].message,
						state: this._getMessageState(messages[iMsgCnt].type),
						icon: this._getMessageIcon(messages[iMsgCnt].type)
					};
					aEditErrMessage.push(aErrMessage);
				}
			}
			if (aEditErrMessage.length > 0) {
				oMessagePopup = this._getMessagePopup(aEditErrMessage, vNavFlag, bIsRfq);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
				oMessagePopup.open();
			}
			this.getModel().refresh();
		},
		UpdtErrorHdlr: function (response) {

			//function for error
			var error = "";
			// if (JSON.parse(oErrorUpdate.response.body).error !== "undefined" && JSON.parse(oErrorUpdate.response.body).error !== "NULL" &&
			// 	oErrorUpdate.response.body !== "NULL" && oErrorUpdate.response.body !== "undefined") {
			// 	var oError = JSON.parse(oErrorUpdate.response.body).error;
			// 	var iChangeRespCount = oError.innererror.errordetails.length;
			// 	var iNoOfErrorMsgs = 0;
			// 	if (iChangeRespCount > 0) {
			// 		var iMsgCount = 0;
			// 		var aMessages = oError.innererror.errordetails;
			// 		var aCompErrMessage = new Array();
			// 		for (iMsgCount = 0; iMsgCount < aMessages.length; iMsgCount++) {
			// 			var oCompErrMessage = {
			// 				name: aMessages[iMsgCount].message,
			// 				state: this._getMessageState(aMessages[iMsgCount].severity),
			// 				icon: this._getMessageIcon(aMessages[iMsgCount].severity)
			// 			};
			// 			if (aMessages[iMsgCount].severity === 'warning' || aMessages[iMsgCount].severity === 'error') {
			// 				aCompErrMessage.push(oCompErrMessage);
			// 				iNoOfErrorMsgs = iNoOfErrorMsgs + 1;
			// 			}
			// 		}
			// 		var oMessagePopup = this._getMessagePopupForEdit(aCompErrMessage);
			// 		if (iNoOfErrorMsgs >= 1) {
			// 			//                                                            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oMessagePopup);
			// 			oMessagePopup.open();
			// 		}
			// 	}
			// }

		},

	});
});