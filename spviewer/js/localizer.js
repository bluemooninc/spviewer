// localizer - javascript library
// == written by Takuya Otani <takuya.otani@gmail.com> ===
// == Copyright (C) 2008 SimpleBoxes/SerendipityNZ Ltd. ==

var __Localizer = function()
{
	this.strings = {};
	this.getLocalizedString = function(str)
	{
		if (__Localizer.strings[str] && __Localizer.strings[str] != '')
			return __Localizer.strings[str];
		return str;
	};
	var path = '';
	var jses = document.getElementsByTagName('script');
	for (var i=0,n=jses.length;i<n;i++)
	{
		if (jses[i].src.indexOf('localizer.js') == -1) continue;
		path = jses[i].src.replace('localizer.js','');
		break;
	}
        var lang = navigator.language || navigator.userLanguage;
	if (!lang){
            lang = 'en';
        }
	document.write(['\n<','script type="text/javascript" src="',path,'locale/',lang,'.js"></','script>'].join(''));
	return this;
};
__Localizer = new __Localizer();
_ = __Localizer.getLocalizedString;
