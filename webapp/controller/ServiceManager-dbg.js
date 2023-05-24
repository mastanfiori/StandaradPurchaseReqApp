/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function() {
	"use strict";

	return {
		activateBO: function(draftId, buisObj, payloadData, controller) {
			var sUrl;
			if (buisObj === 'RFq') {
				sUrl = "/ActivateRFQ";
			} else if (buisObj === 'PO') {
				sUrl = "/CreatePurchaseOrder";
			} else if (buisObj === 'CT') {
				sUrl = "/CreateContract";
			}
			//var oDataModel = controller.getModel();
			var oDataModel = controller.oApplicationModel;
			var oPayload = {};
			oPayload.DraftId = draftId;
			for (var attr in payloadData) {
				oPayload[attr] = payloadData[attr];
			}
			oDataModel.callFunction(sUrl, {
				method: "POST",
				urlParameters: oPayload,
				success: jQuery.proxy(controller.activateBoSuccess, controller),
				error: jQuery.proxy(controller.activateBoFailure, controller)
					//success: jQuery.proxy(controller.successSaveRFQ, controller),
					//error: jQuery.proxy(controller.errorCreateRFQ, controller)
			});
			// oDataModel.submitChanges(jQuery.proxy(controller.activateBoSuccess, controller), jQuery.proxy(controller.activateBoFailure,
			// 	controller), true);
		},
		deleteBOItem: function(draftId, draftItemId, buisObj, controller) {
			var sUrl;
			if (buisObj === 'RFq') {
				sUrl = "/DraftRFQItemSet(Draftid=guid'" + draftId + "',Draftrfqitem=guid'" + draftItemId + "')";
			} else if (buisObj === 'PO') {
				sUrl = "/DraftsPOItemSet(DraftId=guid'" + draftId + "',PoItem='" + draftItemId + "')";
			} else if (buisObj === 'CT') {
				sUrl = "/DraftCtrItemSet(Draftid=guid'" + draftItemId + "')";
			}
			var oDataModel = controller.getModel();
			oDataModel.remove(sUrl, {
				success: jQuery.proxy(controller.onSuccessRFQDelete, controller),
				error: jQuery.proxy(controller.deleteBOItemFailure, controller)
			});
		}
	};
});