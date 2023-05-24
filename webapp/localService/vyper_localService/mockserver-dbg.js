/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/util/MockServer"
], function (MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "ui/ssuite/s2p/mm/pur/pr/prcss/s1/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/vyper_localService/mockdata";

	return {

		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */
		init: function () {
			var count = 0;
			var count1 = 0;
			var fnGetJSONFromFile = function (sFileName) {
				var _oJSON = null;
				$.ajax({
					async: false,
					global: false,
					url: "../localService/vyper_localService/mockdata/" + sFileName,
					dataType: "json",
					success: function (data) {
						_oJSON = data;
					}
				});
				return _oJSON;
			};
			//	this.MockServerMode = true;
			var oUriParameters = jQuery.sap.getUriParameters(),

				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
				sEntity = "C_Purchasereqitmdtlsext",
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oDataSource = oManifest["sap.app"].dataSources,
				oMainDataSource = oDataSource.mainService,
				//	oMainDataSource = oManifest["sap.app"].dataSources.mainService,
				sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"),
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				aAnnotations = oMainDataSource.settings.annotations;

			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				//	autoRespondAfter : (oUriParameters.get("serverDelay") || 1000)
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests(),
				fnResponse = function (iErrCode, sMessage, aRequest) {
					aRequest.response = function (oXhr) {
						oXhr.respond(iErrCode, {
							"Content-Type": "text/plain;charset=utf-8"
						}, sMessage);
					};
				};
			aRequests.push({
				method: "GET",
				path: /.*C_RFQDraftForManagePurReqn.*/,
				response: function (oXhr) {
					if (count1 === 0) {
						var oResults = fnGetJSONFromFile("C_RFQDraftForManagePurReqn.json");
						oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify(oResults));
						return oResults;
						count1++;
					} else {
						var oResults = fnGetJSONFromFile("C_RFQDraftForManagePurReqn2.json");
						oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify(oResults));
						return oResults;

					}
				}
			});
			aRequests.push({
				method: "GET",
				path: /.*C_RFQDraftForManagePurReqn.*RFQDraftUUID=guid'42f2e9af-c3df-1ed9-b491-621f09d3735f'.*to_RFQItemDraftForManagePurReqn.*to_RFQBidderDraftForMngPurReqn.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("C_RFQItemDraftForManagePurReqn1.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			// aRequests.push({
			// 	method: "GET",
			// 	path: /.*C_RFQDraftForManagePurReqn.*to_RFQBidderDraftForMngPurReqn.*/,
			// 	response: function(oXhr) {
			// 		var oResults = fnGetJSONFromFile("C_Bidder.json");
			// 		oXhr.respond(200, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			// aRequests.push({
			// 	method: "DELETE",
			// 	path: /.*C_PurOrderItmDrftForMngPurReqn.*PurchaseOrderDraftUUID=guid'ecebb889-5a65-1ee9-82a2-631c73fbd0aa'.*PurchaseOrderItem=''.*/,
			// 	response: function(oXhr) {
			// 		var oResults = fnGetJSONFromFile("closepoitem.json");
			// 		oXhr.respond(204, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			//		aRequests.push({
			// 	method: "DELETE",
			// 	path: /.*C_PurOrderItmDrftForMngPurReqn.*PurchaseOrderDraftUUID=guid'ecebb889-5a65-1ee9-82a2-631c73fbd0aa'.*PurchaseOrderItem='00010'.*/,
			// 	response: function(oXhr) {
			// 		var oResults = fnGetJSONFromFile("closepoitem.json");
			// 		oXhr.respond(204, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			aRequests.push({
				method: "GET",
				path: /.*SourceOfSupplySet.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("SourceOfSupplySet.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "GET",
				path: /.*VendorSet.*Supplier='16411610'.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("VendorSet.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "GET",
				path: /.*C_RfqBidderVH.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("C_RfqBidderVH.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			// aRequests.push({
			// 	method: "POST",
			// 	path: /.*CreatePurchaseOrder.*/,
			// 	response: function (oXhr) {
			// 		var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
			// 		oXhr.respond(200, {
			// 			"Content-Type": "application/json;charset=utf-8",
			// 			"sap-message": '{"code":"1C98EC1818551ED982B2/001","message":"Shipping processing is not selected to supplier 44300001 in purchase org. 4410","severity":"error","target":"","transition":false,"details":[{"code":"1C98EC1818551ED982B2/001","message":"Doc. type/item cat. NB/ (requisition) <-> NBF2/ (purch. order)","target":"","severity":"error","transition":false},{"code":"1C98EC1818551ED982B2/001","message":"Net price must be greater than 0","target":"","severity":"error","transition":false},{"code":"1C98EC1818551ED982B2/001","message":"PO header data still faulty","target":"","severity":"error","transition":false},{"code":"1C98EC1818551ED982B2/001","message":"Shipping data for plant required in Advanced Returns PO","target":"","severity":"error","transition":false}]}'
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			aRequests.push({
				method: "MERGE",
				path: /.*C_PurContrDrftForMngPurReqn.*/,
				response: function (oXhr, sUrlParams) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"06/017","message":"Standard PO created under the number 4500001644","severity":"success","target":"","transition":false,"details":[]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "MERGE",
				path: /.*C_RFQDraftForManagePurReqn.*/,
				response: function (oXhr, sUrlParams) {
					// var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"98BE94F7BF511EE9B4DF/001","message":"Delivery date is in the past","severity":"warning","target":"","transition":false,"details":[{"code":"98BE94F7BF511EE9B4DF/001","message":"Please enter deliv. date later than deadline for subm. of bids","target":"","severity":"error","transition":false}]}'
					});
					//	return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*CreatePurchaseOrder.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"06/017","message":"Standard PO created under the number 4500001644","severity":"success","target":"","transition":false,"details":[]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*CreateContract.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"ContractId/101","message":"4600003739","severity":"success","target":"","transition":false,"details":[]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*CreateDrafts.*Purchaserequisition='10000005'.*Followondocumenttype='PO'.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"ECEBB8895A651ED982A1/001","message":"Doc. type/item cat. NB/U (requisition) <-> NB/ (purch. order)","severity":"error","target":"","transition":false,"details":[{"code":"ECEBB8895A651ED982A1/001","message":"PO header data still faulty","target":"","severity":"error","transition":false},{"code":"ECEBB8895A651ED982A1/001","message":"Supplier 16411610 has not been created for purchasing organization 5810","target":"","severity":"error","transition":false},{"code":"ECEBB8895A651ED982A1/001","message":"Customer  does not exist (please change entry in plant 5810)","target":"","severity":"error","transition":false}]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*CreateDrafts.*Purchaserequisition='10000003'.*Followondocumenttype='CONTR'.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"CtrDraftRootGuid/101","message":"98BE94F7BF511ED982A364E30B4221D3","severity":"success","target":"","transition":false,"details":[{"code":"CtrDraftRootGuid/101","message":"98BE94F7BF511ED982A364E30B41E1D3","target":"","severity":"success","transition":false}]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*CreateDrafts.*Purchaserequisition='10000003'.*Followondocumenttype='RFQ'.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftsPRCollection.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"DraftId/101","message":"42F2E9AFC3DF1ED9B491621F09D3735F","severity":"success","target":"","transition":false,"details":[]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*AddRFQBidders.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftRFQBidderSet.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"DraftId/101","message":"42F2E9AFC3DF1ED9B491621F09D3735F","severity":"success","target":"","transition":false,"details":[]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*ActivateRFQ.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftRFQHeaderSet.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"8CDCD40087E81EE9B4F4/001","message":"Bidder 1 does not exist for purchasing organization .","severity":"error","target":"","details":[{"code":"8CDCD40087E81EE9B4F4/001","message":"Purchasing organization  does not exist","target":"","severity":"error"},{"code":"8CDCD40087E81EE9B4F4/001","message":"Enter a company code","target":"","severity":"error"},{"code":"8CDCD40087E81EE9B4F4/001","message":"Please enter deliv. date later than deadline for subm. of bids","target":"","severity":"error"},{"code":"8CDCD40087E81EE9B4F4/001","message":"Delivery date is in the past","target":"","severity":"warning"}]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "POST",
				path: /.*ActivateRFQ.*IsPublish='X'.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("DraftRFQHeaderSet.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8",
						"sap-message": '{"code":"APPL_MM_PR/001","message":"RFQ 7000012032 published and sent","severity":"success","target":"","details":[{"code":"RFQId/101","message":"7000012032","target":"","severity":"success"}]}'
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			aRequests.push({
				method: "GET",
				path: /.*C_RFQDraftForManagePurReqn.*to_RFQItemDraftForManagePurReqn.*/,
				response: function (oXhr) {
					if (count === 0) {
						var oResults = fnGetJSONFromFile("C_RFQItemDraftForManagePurReqn.json");
						oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify(oResults));
						return oResults;
						count++;
					} else {
						var oResults = fnGetJSONFromFile("C_RFQDraftForManagePurReqn1.json");
						oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify(oResults));
						return oResults;

					}
				}
			});
			// aRequests.push({
			// 	method: "GET",
			// 	path: /.*C_RFQDraftForManagePurReqn.*to_RFQItemDraftForManagePurReqn.*/,
			// 	response: function (oXhr) {
			// 		var oResults = fnGetJSONFromFile("C_RFQItemDraftForManagePurReqn.json");
			// 		oXhr.respond(200, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			aRequests.push({
				method: "GET",
				path: /.*C_MM_SupplierValueHelp.*/,
				response: function (oXhr) {
					var oResults = fnGetJSONFromFile("C_MM_SupplierValueHelp.json");
					oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify(oResults));
					return oResults;
				}
			});
			// aRequests.push({
			// 	method: "GET",
			// 	path: /.*C_PurOrderDraftForMngPurReqn.*to_PurOrderItmDrftForMngPurReqn .*/,
			// 	response: function(oXhr) {
			// 		var oResults = fnGetJSONFromFile("C_PurOrderItmDrftForMngPurReqn.json");
			// 		oXhr.respond(200, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify(oResults));
			// 		return oResults;
			// 	}
			// });
			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}
			oMockServer.setRequests(aRequests);
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");

			if (aAnnotations) {
				aAnnotations.forEach(function (sAnnotationName) {
					var oAnnotation = oDataSource[sAnnotationName],
						sUri = oAnnotation.uri,
						sLocalUri = jQuery.sap.getModulePath(_sAppModulePath + oAnnotation.settings.localUri.replace(".xml", ""), ".xml");

					///annotiaons
					new MockServer({
						rootUri: sUri,
						requests: [{
							method: "GET",
							path: new RegExp(".*"),
							//	path: new RegExp(""),
							//	path: new RegExp("\\?sap-language=EN") ,
							response: function (oXhr) {
								jQuery.sap.require("jquery.sap.xml");

								var oAnnotations = jQuery.sap.sjax({
									url: sLocalUri,
									dataType: "xml"
								}).data;

								oXhr.respondXML(200, {}, jQuery.sap.serializeXML(oAnnotations));
								return true;
							}
						}]

					}).start();

				});
			}
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function () {
			return oMockServer;
		}
	};

});