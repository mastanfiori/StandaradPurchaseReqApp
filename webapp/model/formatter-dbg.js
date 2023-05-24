/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		formatNumberAndNumUnit: function (sValue, sUnit) {
			if (!sValue) {
				return "";
			}
			var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance();
			sValue = oFloatFormat.format(sValue, sUnit);
			return sValue + " " + sUnit;
		},
		dateFormatType: function () {
			var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
			var oLocale = new sap.ui.core.Locale(sysLang);
			var oDateObj = sap.ui.core.format.DateFormat.getDateInstance({}, oLocale);
			var oLocaleDatePattern = oDateObj.oLocaleData.getDatePattern("medium");
			return oLocaleDatePattern;
		},
		formatPOType: function (vOrderType, vOrderTypeText) {
			return vOrderType + ' - ' + vOrderTypeText;
		},
		formatEditForService: function (sValue) {
			if (sValue === "2") {
				return true;
			}
			return false;
		},

		formatEditForOtherPR: function (sValue) {
			if (sValue === "2") {
				return false;
			}
			return true;
		},

		formatPRItmNum: function (vPRNum, vPRItmNum) {
			return vPRNum + "/" + (vPRItmNum / 1);
		},

		formatDate: function (vDate) { //formatter to convert ABAP date into Date picker format
			if (vDate) {
				//var vJSONDate = parseInt(vDate.slice(6,vDate.length-2));
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				var formattedDate = sap.ui.core.format.DateFormat.getDateInstance({
					style: "medium"
				}, oLocale).format(new Date(vDate));
				return formattedDate;
			}
		},
		formatPRItemDesc: function (vDesc, vMatrl) {
			if (vMatrl === "") {
				return vDesc;
			} else {
				return vDesc + ' (' + vMatrl + ')';
			}
		},
		materialLinkDisable: function (vMatnr) {
			if (vMatnr === "")
				return false;
			else
				return true;
		},
		materialTextEnable: function (vMatnr) {
			if (vMatnr) {
				return false;
			} else {
				return true;
			}
		},

		formatDraftId: function (draftId) {
			// this.oResourceBundle = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle();
			var title = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('PurchaseOrder');
			// title = this.oResourceBundle.getText("PurchaseOrder");
			return title + " " + draftId;
		},

		formatDescMatnr: function (vdesc, vmatnr) {
			if (vmatnr == "") {

				return vdesc;
			} else {
				return vdesc + ' (' + vmatnr + ')';
			}
		},

		formatTotal: function (title, nAmount, sCurrency) {
			var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
			var sAmountAndCurrency = nAmount + " " + sCurrency;
			return title + ' ' + sAmountAndCurrency;
		},

		formatQuantity: function (nQuantity, sUnit) {
			//		var nFormattedAndQuantity = sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(nQuantity, sUnit);
			var sQuantityAndUnit = nQuantity + " " + sUnit;
			return sQuantityAndUnit;
		},

		formatDateRead: function (vDate) { //formatter to convert ABAP date into Date picker format
			if (vDate) {
				if (vDate.getDate() == '31' && vDate.getMonth() == '11' && vDate.getFullYear() == '9999') {
					return "";
				}
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				var formattedDate = sap.ui.core.format.DateFormat.getDateInstance({
					style: "medium"
				}, oLocale).format(new Date(vDate));
				return formattedDate;
			} else {
				return "";
			}
		},

		formatCurrency: function (nAmount, sCurrency) {
			var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
			// var oLocale = new sap.ui.core.Locale(sysLang);
			// var currencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(oLocale);
			// var nFormattedAmount = currencyFormat.format(nAmount);
			//	var nFormattedAmount = sap.ca.ui.model.format.AmountFormat.FormatAmountStandard(nAmount, sCurrency);
			var sAmountAndCurrency = nAmount + " " + sCurrency;
			return sAmountAndCurrency;

		},

		formatPrNumItmNum: function (nPReq, nPReqItem) {
			return nPReq + '/' + nPReqItem;
		},

		formatLinkText: function (FixedvendorCheck) {
			if (FixedvendorCheck) {
				return true;
			} else {
				return false;
			}
		},

		formatDisplayText: function (txt, value) {
			return txt + ' ' + value;
		},

		formatDisplayLinkBracket: function (OutOf) {
			return ')';
		},

		formatLinkDisable: function (Soscount) {
			if (Soscount == 0)
				return false;
			else
				return true;
		},
		formatDisplayLinkOutOf: function (OutOf) {
			return "(" + OutOf + "\u00a0";
		},

		formatSelectSupplier: function (fixedV, desiredV, supplyingvendorname) {
			if (fixedV) {
				if (supplyingvendorname) {
					return supplyingvendorname + " (" + fixedV + ")";
				} else {
					return fixedV;
				}
				// replace with i18
			}
			// else {
			// 	return "";
			// }
		},

		formatCtrDraftId: function (draftId) {
			// this.oResourceBundle = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle();
			var title = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('Contract');
			// title = this.oResourceBundle.getText("Contract");
			return title + " " + draftId;
		},

		formatEmptyInputValidation: function (vInputValue) {
			if (vInputValue === "") {
				return sap.ui.core.ValueState.Error;
			} else {
				return sap.ui.core.ValueState.None;
			}
		},

		validateCtrPreviewScreenInputs: function (vErrorMsg) {
			return vErrorMsg;
		},

		formatPurOrg: function (vdesc, vmatnr) {
			if ((vmatnr === "" || vmatnr === undefined) && (vdesc === undefined || vmatnr === "")) {
				return;
			} else if (vdesc === undefined) {
				return ' (' + vmatnr + ')';
			} else if (vmatnr === undefined) {
				return vdesc;
			}
			return vdesc + ' (' + vmatnr + ')';
		},

		formatCTRValStartDateValidation: function (date) {
			var today = new Date();
			var selectedDate = date;
			var sToday = today.toDateString();
			if (date) {
				var sSelectedDate = date.toDateString();
				if (sToday === sSelectedDate) {
					return sap.ui.core.ValueState.None;
				} else if (today > selectedDate) {
					return sap.ui.core.ValueState.Error;
				} else {
					return sap.ui.core.ValueState.None;
				}
			} else {
				return sap.ui.core.ValueState.Error;
			}
		},

		formatCTRValEndDateValidation: function (date) {
			var today = new Date();
			var selectedDate = date;
			var sToday = today.toDateString();
			if (date) {
				var sSelectedDate = date.toDateString();
				if (sToday === sSelectedDate) {
					return sap.ui.core.ValueState.None;
				} else if (today > selectedDate) {
					return sap.ui.core.ValueState.Error;
				} else {
					return sap.ui.core.ValueState.None;
				}
			} else {
				return sap.ui.core.ValueState.Error;
			}
		},

		validateTargetValueInput: function (vCtrTyp, vTargetValue) {
			if (vTargetValue) {
				//Dumps for indexOf in Opa5
				if (this.getTestMode() != true) {
					var bNotNegative = vTargetValue.indexOf("-");
					if (bNotNegative >= 0) {
						return sap.ui.core.ValueState.Error;
					}
				}
			}
			if ((vCtrTyp === "WK" || vCtrTyp === "CWK") && (vTargetValue === "0.000" || vTargetValue === "")) {
				return sap.ui.core.ValueState.Error;
			} else {
				return sap.ui.core.ValueState.None;
			}
		},

		formatCtrTargetQty: function () {
			// this.oResourceBundle = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle();
			var vQty = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('TrgtQty');
			var vUnit = this.getOwnerComponent().getModel('i18n').getResourceBundle().getText('OrdUnit');
			return vQty + " / " + vUnit;
		},

		validateQtyValueInput: function (vCtrTyp, vQtyValue) {
			var number_to_array = vQtyValue.split(".");
			if (number_to_array[0].length > 10) {
				return sap.ui.core.ValueState.Error;
			}
			if (number_to_array[1] !== undefined) {
				if (number_to_array[1].length > 3) {

					return sap.ui.core.ValueState.Error;
				}
			}
			if (vQtyValue) {
				//Dumps for indexOf in Opa5
				if (this.getTestMode() != true) {
					var bNotNegative = vQtyValue.indexOf("-");
					if (bNotNegative >= 0) {
						return sap.ui.core.ValueState.Error;
					}
				}
			}
			if ((vCtrTyp === "MK" || vCtrTyp === "CMK") && (vQtyValue === "0.000" || vQtyValue === "")) {
				return sap.ui.core.ValueState.Error;
			} else {
				return sap.ui.core.ValueState.None;
			}
		},

		editablePOrgPGrp: function (bEditable, vValue) {
			if ((vValue === "") || (bEditable === "true")) {
				return true;
			} else {
				return false;
			}
		},

		formatDisplayBidder: function (vSupplier, vSupplierName, vAddress) {
			var newlin = "\n";
			return vSupplier + "\n" + vSupplierName + "\n" + vAddress;
		},

		// formatDateRead: function(vDate) { //formatter to convert ABAP date into Date picker format
		// 	if (vDate) {
		// 		var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
		// 		var oLocale = new sap.ui.core.Locale(sysLang);
		// 		var formattedDate = sap.ui.core.format.DateFormat.getDateInstance({
		// 			style: "medium"
		// 		}, oLocale).format(new Date(vDate));
		// 		return formattedDate;
		// 	} else {
		// 		return "";
		// 	}
		// },

		formatDateOkButton: function (vItemCategory, date) {
			// var today = new Date();
			// var sToday = today.toDateString();
			// var selectedDate = date;
			if (vItemCategory === 'A') {
				return true;
			}
			if (date) {
				// var sSelectedDate = date.toDateString();
				// if (sToday === sSelectedDate) {
				// 	return true;
				// } else
				// if (today >= selectedDate) {
				// 	return false;
				// } else {
				return true;
				//				}
			} else {
				return false;
			}
		},
		formatDocItemCategory: function (vItemCategory) {
			if (vItemCategory === '6')
				return false;
			else
				return true;
		},
		formatEditForLimit: function (vItemCategory) {
			if (vItemCategory === '6' || vItemCategory === 'A')
				return false;
			else
				return true;
		},
		formatEditQuantity: function (vValue) {
			/*if (vItemCategory == '6')
				return false;
			else
				return true;*/
			if (parseFloat(vValue) == vValue) {
				var number_to_array = vValue.split(".");
				if (number_to_array[0].length > 10) {
					return sap.ui.core.ValueState.Error;
				}
				if (number_to_array[1] !== undefined) {
					if (number_to_array[1].length > 3) {
						return sap.ui.core.ValueState.Error;
					}
				}
				return sap.ui.core.ValueState.None;
			} else {
				return sap.ui.core.ValueState.Error;

			}
		},
		formatSupplierText: function (fixedV, desiredV) {

			if (fixedV) {
				return fixedV; // replace with i18
			}
			// else  {
			// 	return "";
			// }

		},

		formatEditDeliveryDate: function (vDate) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd/MM/YYYY"
			});
			var date = new Date(vDate);
			var dateStr = dateFormat.format(date);
			if (dateStr == "31/12/9999") {
				return "";
			} else {
				var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
				var oLocale = new sap.ui.core.Locale(sysLang);
				//	sap.ui.core.format.DateFormat.getInstance();
				var formattedDate = sap.ui.core.format.DateFormat.getDateInstance({}, oLocale).format(new Date(vDate));
				return formattedDate;
				//	return vDate;

			}
		},
		formatDateValidation: function (vItemCategory, date) {
			if (vItemCategory === 'A') {
				return sap.ui.core.ValueState.None;
			}
			//			var today = new Date();
			//			var selectedDate = date;
			//			var sToday = today.toDateString();
			if (date) {
				//				var sSelectedDate = date.toDateString();
				//				if (sToday === sSelectedDate) {
				return sap.ui.core.ValueState.None;
				// } else
				// if (today > selectedDate) {
				// 	return sap.ui.core.ValueState.Error;
				// } else {
				// 	return sap.ui.core.ValueState.None;
				// }
			} else {
				return sap.ui.core.ValueState.Error;
			}
		},
		formatitext: function (vBeforeColon, vAfterColon) {
			return vBeforeColon + ": " + vAfterColon;
		},
		formatAcct: function (vname, vnr) {
			return vname + ' (' + vnr + ')';
		},
		formatSosInfoCtr: function (vInfrtxt, vInfrvalue, vCtrtxt, vCtrvalue, vschetxt, vtype,vOunittxt, vOunitvalue) {
			var orderUnit = '';     // Note 2955942
			if (vOunitvalue){
			    orderUnit = ' - ' + vOunittxt + ' ('+ vOunitvalue + ')';
			}
			if (vInfrvalue)
				return vInfrtxt + ' (' + vInfrvalue + ')' + orderUnit;
			else if (vtype === 'K')
				return vCtrtxt + ' (' + vCtrvalue + ')' + orderUnit;
			else if (vtype === 'L')
				return vschetxt + ' (' + vCtrvalue + ')' + orderUnit;
		},
		formatSoSTotalPrice: function (total, nAmount, sCurrency) {
			var sysLang = sap.ui.getCore().getConfiguration().getLanguage();
			var oLocale = new sap.ui.core.Locale(sysLang);
			var currencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(oLocale);
			var nFormattedAmount = currencyFormat.format(nAmount);
			//	var nFormattedAmount = sap.ca.ui.model.format.AmountFormat.FormatAmountStandard(nAmount, sCurrency);
			var sAmountAndCurrency = nFormattedAmount + " " + sCurrency;
			return total + ' ' + sAmountAndCurrency;
		},
		formatSoSDate: function (vfrom, vto) {
			if (vfrom === undefined || vto === undefined || vfrom === null || vto === null) {
				return;
			}
			var vf = vfrom.toLocaleDateString();
			var vt = vto.toLocaleDateString();
			if (vf === '1/1/1990') {
				return '';
			} else {
				var vret = '(' + vf + '-' + vt + ')';
				return vret;
			}
			return;
		},
		formatCtrPRItemDesc: function (vMatrl, vDesc) {
			if (vMatrl === "") {
				return vDesc;
			} else {
				return vMatrl + "\n" + vDesc;
			}
		}

	};
});