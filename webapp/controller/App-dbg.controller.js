/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ui/ssuite/s2p/mm/pur/pr/prcss/s1/localService/mockserver"
], function(BaseController, JSONModel, Mockserver) {
	"use strict";

	return BaseController.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.App", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded().
			then(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			if (Mockserver.MockServerMode) {
				this.setTestMode(true);
			} else {
				this.setTestMode(false);
			}
		}
	});

});