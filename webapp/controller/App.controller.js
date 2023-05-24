/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["ui/ssuite/s2p/mm/pur/pr/prcss/s1/controller/BaseController","sap/ui/model/json/JSONModel","ui/ssuite/s2p/mm/pur/pr/prcss/s1/localService/mockserver"],function(B,J,M){"use strict";return B.extend("ui.ssuite.s2p.mm.pur.pr.prcss.s1.controller.App",{onInit:function(){var v,s,o=this.getView().getBusyIndicatorDelay();v=new J({busy:true,delay:0});this.setModel(v,"appView");s=function(){v.setProperty("/busy",false);v.setProperty("/delay",o);};this.getOwnerComponent().getModel().metadataLoaded().then(s);this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());if(M.MockServerMode){this.setTestMode(true);}else{this.setTestMode(false);}}});});
