// ==UserScript==
// @name           Google Images direct links
// @author         Dwoo, lemonsqueeze
// @version        2011-10-06-google_classic
// @namespace      http://userscripts.org/scripts/show/48293
// @scriptsource   https://raw.github.com/lemonsqueeze/google_classic/master/google_images/google_image_direct_links.user.js
// @upstreamscriptsource      https://userscripts.org/scripts/source/48293.meta.js
// @description    Makes images link directly to the original in Google Images search. The source website link is moved to the green URL below the image. Also gives the option to always use the basic (old) version of Google Images.
// @include        http*://images.google.*/*
// @include        http*://www.google.*/search*tbm=isch*
// @include        http*://www.google.*/images?*
// @include        http*://www.google.*/imghp*
// @include        https://encrypted.google.*/search*tbm=isch*
// @include        https://encrypted.google.*/images?*
// @include        https://encrypted.google.*/imghp*
// ==/UserScript==

// Test urls:
// Extra params (Large [x]), 'Search instead for ...'
//   http://www.google.com/search?btnG=Search&as_st=y&tbm=isch&hl=en&cr=&safe=images&tbs=isz:l&sout=1&q=calvn%20hobbes
// Related searches
//   http://www.google.com/search?q=calvin+hobbes&btnG=Search&as_st=y&tbm=isch&hl=en&cr=&safe=images&tbs=isz%3Al&sout=1
// Homepage
//   http://images.google.com/

(function (document, location, setTimeout, scriptStorage) {

if (window != window.top) // don't run in iframes
    return;

function get_setting(name, default_value)
{
    var val = widget.preferences.getItem(name);
    val = (!val && default_value ? default_value : val);
    return (val ? val : '');
}

function set_setting(name, value)
{
    widget.preferences.setItem(name, value);
}

function get_bool_setting(name, default_value)
{
    var c = get_setting(name);
    return (c != '' ? c == 'y' : default_value);
}

function set_bool_setting(name, val)
{
    set_setting(name, (val ? 'y' : 'n'));
}

document.buildElement = function(type, atArr, inner, action, listen)
{
    var e = document.createElement(type);
    for (var at in atArr)
    {
        if (atArr.hasOwnProperty(at))
            e.setAttribute(at, atArr[at]);
    }
    if (action && listen)
        e.addEventListener(action, listen, false);
    if (inner)
        e.innerHTML = inner;
    return e;
};

function evalNodes(path) {
	return document.evaluate(path, document, null, window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function evalNode(path) {
	return evalNodes(path).snapshotItem(0);
}

function basicVersion() {
    return true;
    /*
	if (typeof GM_deleteValue == 'undefined') {
		return localStorage.getItem('basic') == 'true';
	} else {
		return GM_getValue('basic')?true:false;
	}
     */
}

function checkVersion() {
	if (basicVersion() && (/&tbm=isch/).test(document.location.href) && !(/&sout=1/).test(document.location.href)) {
		window.location = window.location + "&sout=1";
	}
}

function saveVersion() {
	var v = (/&sout=1/).test(document.location.href)?false:true;
	if (typeof GM_deleteValue == 'undefined') {
		localStorage.setItem('basic', v);
	} else {
		GM_setValue('basic', v);
	}
	window.location = window.location+"sout=1";
}

var advanced_search_url;
function init_bottom_links()
{
    var link = evalNode('//div[@id="foot"]//p/a[contains(@href, "advanced_image_search")]');
    advanced_search_url = (link ? link.href : null);
    
    // setup 'switch to standard version' link
    link = link.parentNode.getElementsByTagName('a')[2];
    //link = evalNode('//div[@id="foot"]//p/a[contains(@href, "/search")]');
    if (link)
	link.onclick = function(){ set_bool_setting('images_disabled', true); };
}

function add_extra_sizes_link()
{
    var last = document.body.querySelector('li#isz_i');
    if (!last) return;
    if (!advanced_search_url) return;

    // TODO: translate link text for localized versions ...
    var d = document.createElement('div');
    d.innerHTML = '<li class="tbou"><a class="q">More…</a></li>';
    var li = d.firstChild;
    li.firstChild.href = advanced_search_url;
    last.parentNode.appendChild(li);
    
    // highlight if currently in use
    var items = last.parentNode.children;
    for (var i = 0; i < items.length; i++)
	if (items[i].className == "tbos")
	    return;
    // nothing selected, highlight    
    li.className = "tbos";
    li.innerHTML = "Other";
}

function cleanURL() {
	this.href = this.href.replace(/.iact=.*/, '');
}

function link() {
	this.removeEventListener('DOMNodeInserted', link, false);
	var host = this;
	var a = document.createElement('a');
	a.innerHTML = host.innerHTML;
	var name = this.parentNode.parentNode.firstChild.firstChild;
	a.setAttribute('href', decodeURIComponent(decodeURIComponent(name.href.match(/imgrefurl=([^&]+)/)[1])));
	//a.setAttribute('style', "text-decoration: inherit; color: inherit");
	a.addEventListener('mouseup', cleanURL, false);
	host.replaceChild(a, host.firstChild);
	try {
		var img = this.parentNode.parentNode.previousSibling;
		name.href = img.href = decodeURIComponent(decodeURIComponent(name.href.match(/imgurl=([^&]+)/)[1]));
		name.addEventListener('mouseup', cleanURL, false);
		img.addEventListener('mouseup', cleanURL, false);
	} catch (e) {}
	this.addEventListener('DOMNodeInserted', link, false);
}

function setTrig() {
	var t = document.getElementById("rg_hr");
	t.removeEventListener('DOMNodeInserted', link, false);
	t.addEventListener('DOMNodeInserted', link, false);
	setTimeout(setTrig, 1000);
}

function oldLinks() {
	var imgs = evalNodes('//a[contains(@href, "/url")]');
	var img;
	for (var i = 0; img = imgs.snapshotItem(i);  i++)
        {
	    try {
		img.href = decodeURIComponent(img.href.match(/url\?url=([^&]+)/)[1]);
	    } catch (e) {}
	    try {
		img.href = decodeURIComponent(img.href.match(/url\?q=([^&]+)/)[1]);
	    } catch (e) {}
	}
//	t.addEventListener('DOMNodeInserted', oldTrig, false);
}

function oldTrig() {
	t.removeEventListener('DOMNodeInserted', oldTrig, false);
	setTimeout(oldLinks, 100);
}


/************************************************** styling *************************************************/

/* Google Images Styling by laurenbacall */

var zoom_on_hover_style =
".images_table a img:hover { -o-transform: scale(1.1) !important; } /* Enlarges thumbnails in Images section on hover */";


var common_style =
"#modeselector,"+
".lnsec                  { display: none; } /* Hides the redundant side Web/Images/etc menu with horizontal divider */"+

"a:link,"+
"a:visited               { text-decoration: none; }"+

".images_table a img	{"+
"                            padding: 0 !important;"+
"                            border: solid #eee 1px !important;"+
"                            box-shadow: 0 2px 3px hsla(0,0%,0%,0.4);"+
"                            margin: 1px;"+
"                        }"+

"/* Image info text pseudo-targeted with overlay! */"+
".images_table td:after  { height: 16px; background: hsla(0,0%,100%,0.5); content: ''; display: block; margin-top: -16px; position: relative; z-index: 1; }"+

"";

var night_bgcolor = get_setting("images_night_bgcolor", "#222");
var night_style =
"body			{ background-color: " + night_bgcolor + " !important;}"+

"/* Additional parameters indicator strip (eg: 'Large (x)') */"+
"#tbbc                   { width: 100% !important; display: block !important; "+
"			  background: #2a2a2a !important; border-radius: 5px; }"+

"body,"+
".images_table tr b                       /* Image results text bold */"+
"                        { color: #d6d6d6 !important; }"+

"td.sfbgg a.fl,                            /* Safe search link */"+
"p.msrl a,                                 /* Related search terms */"+
".images_table a:link,"+
"#topstuff a:link                         /* Image URLs and 'Did you mean?' links */"+
"                        { color: #48f !important; }"+

".images_table tr,                         /* Image results text */"+
"#leftnav a,                               /* Side menu non-active links */"+
"#foot a                                   /* Pagination 'Prev/Next' */"+
"                        { color: #888 !important; }"+


"/*-------------Various horizontal dividing lines----------------*/"+

".ab_bg			{ border: none !important; border-bottom: solid #121212 1px !important; box-shadow: 0 1px 0 #2a2a2a; margin: 1px; }"+

"/*-------------Image thumbnail results, also the thumbnails in web results----------------*/"+

".images_table a img	{"+
"                            border: solid #141414 1px !important;"+
"                        }"+

"/* Image info text pseudo-targeted with overlay! */"+
".images_table td:after  { height: 16px; background: "+ to_rgba(night_bgcolor, 0.5) + "; content: ''; display: block; margin-top: -16px; position: relative; z-index: 1; }"+

"/*-------------Sprite (nav_logo117.png), Logos----------------*/"+

"#tbbc .close_btn        { background-position: -138px -83px !important; } /* Additional parameters indicator strip close 'X' */"+

"#tbbc .close_btn,"+
".csb                    /* 'Google' pagination sprite */"+
"                        { background-image: url('data:image/png;base64,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') !important; }"+

"/* Large Google Images logo */"+

"#hplogo[src*='images_logo'] {"+
"                          width: 276px; height: 110px; "+
"                          background-repeat: no-repeat;"+
"                          background-position: 0 bottom;"+
"                          background-size: contain;"+
"                          content: '';"+
"                          display: block;"+
"			   background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARQAAABuCAYAAADmvuxqAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAJcEhZcwAACxMAAAsTAQCanBgAAF2NSURBVHja7X13nF1lmf/3fc85t0+fycxkUiZlkpBGEkLvgdCLgKIogt11xbprWXRd2+r6s+DqumtHsCAoCFIUApEaagIkEJJMeqa32097y/P745ybuYnpZILAffK5nzu55dxzzvu+3/ep34cRESpSkYpU5HAIO9gvNDQ0IZlKYfu2LZW7V5GK7Eci3KptPn7ihfM+tviTqfm1c1zh+C5cCC0BMGhSsKWNgucg7WVY3skZaqsaMu5x/+z8Lf0jLXUnAP16uV7zNbvRJsANHldkJuoaxtc1t05qYIaVIHCTG5G4kl6BM2JaCUdJz+naumHAcwsehyxoRa6vKpO1Iv+4YkUjLeNOHn9586UTr6o6vv5YJyGjUmRARHGffDjaAwC4qoiMl8FQNg97uAD21+Jz1nL9NzEoHtXQNgALgFcBlDLhDDANxBpapk0aN/noxVbTwnl1TbOmGYnWds9oavFZY200kowpzQ0wAMzgSpM2mYZpKA0SosUbyESRty051OPk+7d1bXpyfdTfsaFn86rnM8Pd/aQpLzUq9ltFXlNpbB93TPy4qkus45MX6dls3lAyZw07WXCXoypRgxiLgTEGgOApF1kvi6FsDnZXAfxlMWTcr5b5Gf8ZAJ0AcgDE6+n6xwxQGIB4IlE9adYppyXaTj1j3PSzT/fic2YrVCVsH+ixAWEDwgNAABGgFYV/axgW5yAObhjcNAzTikyLmxZgWJgWacSp4ye8E4aWqD2xZygqu3vs/uefyex4/LnBbc88Ody3uVMpOBV0qcgRFo4Im2CYZu3IzT1/0ba4T2oNrTVZE2KtmeuyV6ZaU9VRFgFBwxEeMrki/O02jH4fxibZJTPyFQBbAPQDKL6ezJ0x8aEYHLx9xoJFbQvf9Y5k+8WXiejMqQUXyKYBzwF8lyAlwMDApICWBTDyoLUiSF8x0zJAjDFugowEiMVBYABTMC2CaRKsKBCNMlgRhkjUgmEwcAOImRLCHi7y3PMru1+67d7hznv+XMwNb/al9itzvSJHDFSAJIA6BsSotMYMtEW/3fLT5MLkNFMZIBDsooQzVIS1zYcc9hB51rjfe8b+gYZ+HsAwgNfdvD1sGorBwNrnnnHOjNM/eZ3Zcs7ZORGPdQ0DhR0ablEDMKF9G8zZXGT2qu7C4OpeLrv7mdjaD+W6Stqu7+bsaKwqSjBMw6qKITqhgay2lmj1zPGs6rh2abWlfKPeYAYDNyQiUYZITCKeYIhGAI8bYKhPivi5p9WfeO5pDQu2ft7u+svyYtc9d/RtWHaf7chMZb5XZIxFA7ABuCGYMAAKnJEVMzkHA2kNoTWUJsDTkJ4CNODv8F/R0JnQZyJfjxf/qgGFAZh61HEnzjjrc9dHJl10XsaOmEPdBDsn4doM2tdg7iZHDN6zzh9+7GVn8KEXtbS7taYhAIXw5pduoPaKfRQelgPPmgASnKHWiKRaE/Wz50YazjqW1y49WsUWNtqOCddUsGMWojEgnhCIRgHOJIQPCBpfp8d/5IpU2weumD37sZXdK7/9o/7O+2/ThGJl3ldkDEWFj9F1wqGtGLc44zBMA1oKcKYBBhjchOYKxEmFa0G/3kydwwIotXUNLYsuvP7zDQs/8qGsH4/v6CFkhiScgobyNJi9Out3/3KF03fnU26hfy2APgDp0NnkhjfPD7wooLKbyMrUR64JpvYKVrb3mYd57zONhnVDR6rtoguj468+S0RPnegJBmEruEUD8ZSJWEzCMDhAElIIFF3A808/xpp74i8ntt727uzLX/nP7NDWR+h1ugtU5HUojBHnBgzDBHQw3Smc9ZJL8MBPq8P18LqNYRoH+4V4PAGLK7ROP+mC49/zxz9Epl18/tCIZfVsF0gPKrgFAtkDWm7/xiOZNZ+40R5c8VfpF58DsAnADgADALK7aSYlRNe7PVT4vh8CkE3AiNZym5tZ+6Tff/vThugUVmLCZM3Gx5WQEL6G8Bk0AZoYfI9BuBLCduHZHjw+d0q89W3vTMXsaj+7tlMp+bpzfFXkdYgnBqtLXFL3XqPOrIYGpNLwPQmyBYysBnkaWKdXUF6vBpB5PfpPDklDIS2tOWd9+gu1x3zsMzmRSgzv0BgZUsiNKGhXgobv2uLt+P5fCgPPPUbA5lAryQBwyuzCQwnAUPj9EsDYvi+G/e1/XJPKPvZQbPInPkq17zpR6ThIKUhhghscpAhKapDwQMKHFhnklWlG67/y6YYpOd63/ravEJB/Pe8KFXm9KCkMrDT5Q6OeiMDBd9/RXrcByoMClLq6+rpTrv7xTxKz3va2bB4Y6JUYHiQ4WQnt5qG6b3gi1/ndP0olXgawHUHoy0YQSz+cN4nKNBu/kO3/k/PS9avr2p//lNH2taulbrBIOlCMg7QCSQEtPJBwAzVT+VIM/mh5ru/OFwioCX05FanImAmBoLUeXQNEYBoAYxBMgb+eUeRQAKWhYdzE099308+sKeedm80GYDLYp+HlBFRxSKvu/1yW3/KzWxVhPYBtZVqJHtNxCp25SmPd0OY/XJ8sdG2KT/vuvwo+tRa6CJISJF1o5Qe2q3Y8jHz/L4W+P92lgbUItJNKykpFjpSaAiIdYooGiGDAhH6DKMjmAYJJ2xkfvOV3xsQlp2QzhIE+hYE+BTfjgpy09rdcf0+h65Y/ErCuDEzEEVyoOvytgeLAkz9k8l09iRk/+qYjpjZD5aCFDN2+tsdG/vtuu//uezTwMoCtqJg7FTkSOAIGIgIRgQHQRIHNA0CTBKM3xq7G92/mNDad/oHf3cQnLjmlmCekRzSGBghexoF2sqR2fPWvxe5b7iDgFQQ+k5JD6Ujfn1KUqFgY2fJ7Z8NHPxnlW0dIGwAMGNwVRvaGP9v9d9+pgdUIshGzeJ2lNlfkdWz0hGEdDQJjDBoaxAik6Q2jI+8TUOIxK3LKtT/7caT9rLNcG0iPaAz0arjpAoQtQEO3vJDffuPdmnZqJjm89t5pBcBpaG43YNZVac3AmeOpgf/6Q6H33pKZs70CJhV5LUSH4BG4U9ioh5a9CQDl6KWfvD418y2X20Ugl9UYHNCwMx6U64MVHuuyt33rDqXxCoJw8D/MAm2dNHVqYsbXv1G0Gy2Lj9i678u32QMP3K1pp5mTRSUHpSKviZ6ioUMfCicW6NRvHDzZuw9l7vEXX9y+9L++VCwCjq0xMqxRSEtIOw/tZ7XsveEBz06/EILJCP5B4uYGB8Yd/Zlv9WcTbSk8sD6348aHvPQzywFsANAV+kwqYFKR1wZQwkAPgUBM7fQM0BsZUBqaWid1nPPVb3jEmRSEkRFCZoSC0LCngJE7VhUHH38iNB2G8A/E12DGquvF8JNrhld94V6S2byUagRAD4J8mGIFTCrymoMKAUxzlNgSmSaEAZ83JqAsOP/6z/GWBXOdHKFYJBRyBFF0IR0XkMPC7fvto1pjI4KsV/sfCWA9OzeydsXNXwdQF16fCM/RRyUjtiKvKZDQTsOHQAAFhg4xeuOaPB3zTz+tYcGHPlgsAkIQcllCIUvQbhFKGtCZv6zxsmtXAhhE4IT9R9zxdWiGsbL/V6Qir6HvBKSJSIdhY2IUOGZLJhC9MUBlF0AxGDDt1E9+qqgjlhIajgsU8oB0XShfgKkc6cw9z1LgN/lH52sgVBLWKvIPIruDhQ4LBEszlOiN4ZjdJcozfcHZS2Ptb3mLcAHPAwp5glNUUJ4NrTTIXr3dGXn+hRBMKv6IyjIJpxDHAaQ0ven9JqPgQaNbHgv8Kfy1HEMGgDEcDkjbqaGYDGg/8bp/dhUA0vB9glvUEJ4PUj5IEWT2kVeUdLcgSF7zKtPkQBYcGRNbWya01tRMMH2veXZL8/iO6uqWZCyW8qRwN+SL3S9393S7Bu/vzxd27Ojp7fnHA2oGACwWiyXnHtXeXhX3OxbPmzxp6sSq5lSMGsEAqZjI2lb/ytUbezq322s3bOrfMpLODQBQFUUx1EoooCwoPcrRhggIawfHUoyJ41snTK1KzjtuXNOcWS0t0yxQdYKzpCuVI8AKG0fSmx/p6n653xcbOrfv2Agi75AApXXKnHlW2znnCQVICbgu4DiA9nxoSWA6q+Gs6gx9EzYq6ep7lWgsmjxmYttJ50yaeMaCRPzEBZHorEbLqjc8ETUJMEvEDNEk3HgSsrUNghveoPIHnsxkVz0+nH7srzu2PdjVP/DKa2tWMnRMbZt51nE151x8xsRzp49LH9XeGhkXsVQKPA+YaUCrwLnIDYDFgUtroGSD3z3QOLyuK7ruwWdGHrzxT5tuHxopbHwt5wwDYJpmfPyE9uZIoq4ZRryGzFS1VDBGS4DD9c0tE8zgYCYHAC1dBXAQDENrTRoBTalSGkqDM2KQlIgZYDDthx8a6Nmybk/mttIERXrUGFcEKAZoKikrYyKTW1umXX7UjLcsaag7b55lzmmLRJtN1+MoZehqBrJiAbVc23g44yciI8TwilmznvtN58Y/PjIy/NdcLtcd+nvogAClbc4lb1FGPOYVCUIQPJcgXAWmfZDmMOT2ETezdj1Gs2Er285uMqm1pf2tMzve8dam+rcvjETmxnJFEwUPcG0oISEBCE0QAEzTCLhyIwZgWohEItH2iDlxRjQ58R2tyUu31o8besgtPHrT1i03PdPdtRxKF0oqz1hfRyyWNI5f0HrKBy5t+eglp0TPra7LV8PbHAy7LQNmGk2Bq9vigKEAMgBYADNgGEZk0jirdVJLtvWcEyNn/uvl7Z997JWqx79/a+9PHn92218BEkfiWqKWYbRMmDq9ZdZ551U1L5jvJ2YtitTOmhyJxJI8ErEYNxnjAOfB2egy1z1JQChAKsD3ASE0lCC4ngHPAYQICNa1AgxGMLwXHAz/4YGhl9MrMBpd/DtQY2DQdGTaM0xvbT7q/fPmfOTK5qbLp0rVhoIDpIvQnoArCaQkTMZhmgakYcCPmqBIDAYjjGO84W1W/NzLZsw+9xmt1n93x7Yf/WnD+t9Aqey+/JMmAEQjZqy+49IL80UASkMIwCkStFJBYZ2WgL+hD7pYTkdQkVAaG+qb/+nYRf/8gQktH5hcdMYjnQdGhtHj+v4a6fc/XMhuWO97PcNaFqCBaoNHJpvRxtPiVXNOjcYm1xuW5UcYCvEkjIgBcAMTtW58P09cfumUORfdN6H9oa9uePlrXUPDz2BXZrvDLqeeMOv4r//zUV8+7ej8OWAjHHYvMORhqE/LJ9bqbc9ukNsG0pTJOigoDTW5iRrnTolMWtzBJs2ZZtfxCADfAvwIYJgAJMbV65orTrEvvOKUmgt/eNukW/7z5uH/6h8qrB4rUEnEY/GOYy67Yty8q6+S1aecmverq7rcYBrTwKgDNBrRiEYJkQgQjzEYXINxDlIKwlfwpAnXUXD9CITP4RQB4SkozwdJBSIF0105KHv/72+Frj/fL4S/EkDv3hxKhFFTZyzzThobG5v/adH86z44vvkDk3zRgr5hqIKHlxwvc0d+5IU1Rbsrp7VdVNKdFk82LIjGp54dT86aHYnUiYgDEYtBRKMQBqClwnG+mPmruuYfnDMvceG/da79t0zRfgmjBGh/DyiTZxwzX1XNX0RhfbAUBCkJWiiQVgAz4WbWbZcKIxjlvKx4SAwDZ8896uLvHL/om/OVmkO9Q0DGRk/R836Tzbxw40jfoxuKhQ1aqhLJVDkYJ35kGo2zE6kF721oueDqaPVxVU7W9OMR6FgMOmIBnJBwZeRdPjv/5PbZJ1xf3fOtu7q2/xS+yB1u86G6Kln7H9ed8PkPXl51XVW8L4n8MOA72LxRFm5+UK665dH8ig3dcg0gS1zAJae8AZg1sQhruezE+NmfuSJ26cKj3GaQBOkImGEBfqjQyyF87O3mVZccW7fkqm+Yn3xyTf5OQB22/CCTg8069uJLJ578718qxI9duH0QcLoAcnOSF1YOFIfX9jNV9GLVbXW86ugWNz69mniMxaISsbhGPA5EoxIMBKEMSKHhegZkem3aGd6WJopEDaXAtWJaKfj9dzyf7b39b76bL/H/DGE/vXS0AhixUXRRhze8c8yM6afccNpJN5zKsZj6hoDhAtYU3Mw3h3ofuHdo4Kmc520J3RYFAP5TGOK/ZaiuisXa393UcslX6lour/KF4SQ1yLJADChwA0wKvB+Rc6dPmzf93VtfubYvl3u2ZMn9HaBYjYtPEzxuKRmMq+8HfhSQDyIGaA9c9wyGk+hNnyAWS8RgWZH45087+UufnT75c+bgCBMDI6DhIh4sFLddP9B114uZkadA6EZAMpXDrkRTgfYrlbU2l33uM4Xc/cvHjX/Hl6vGvW+O0HWeL0HxKHQkCuIcigjtvqi7MdH8Xz+allr0ta3rPuc7Xlc4mK96n5s6qWXaD7+w4GcXnGWdiUwXMJKGLDq45UFa92+/Sv+he9h9DkG2cTkfsBw1+yVzfVi3PCIev/sZ944vXlX/6c9d7p3DDAdkJgNNhfFgumV9TG7xmx/8dvK3X/hF7Iff/0P/fwD0qrXexsZxExZd9p1v8fZ3vbN3gCO9DZCFIc/b9L0VhW23rtDOtk4h1QAIrmkgzqxkXVXLSccmpn780kLVee3FAiEWB2JxDivKwElCSsDzTHiZYbu45mO3FkY2r2WGSYwFpcNCqAwFGdj9COrDvL2OSXinNNMIual399i+6pG8YP6ca35y2gnfmeC6TaJrCHyogJvT2Zc+27XpD0OO8zyC0pPShuDtNF0IZt5xX/nf7VufXenaa37VOuWzU/PFVDGVBLMsMBAUgLxSONlV037ROv3G9+j1HxgsFJ/dXcEwIhyYcfq/XOfG586D1lAK8D3AKWiQ70FLAYP7oJFbH/UKO54OJ9URjfDMmL0IucwwtA7A0DAMWFYESr02Pr5JrS2tP7niol++v6nuA3wkzfy+EbDhIv5veGTV+3d0/rynWFyBUW6YgTK/kx8uRBE+PAAOCEMbC/nnliuna1Ekdcx4yaqUlGECFAcYgwSBii5OlpE545ua5v/Nzj4thMi9WnA/5/Q5p//lx8fdc/Qsbz4yA4CXhcwU8flf+A999pcjP8s7/lMI+IC7EKQLFMLrELs9PACOL1XXg88XH+pJx1PnzTePMWDvxE+wMEQpNCK6wM47mU7I2amap152HsMop/BBy+yFZ5x84vv+eLvTcNaZvT2E9BCD3/dkX+7pS3+R3XbnH6WXfkZpKhF/9WjCNiXFZiez+Wl7+y2PxU27ltecNsu1CcJTQccECQgfcG0JwdqrU23nL4h4T6/IjXQ9pJTeojSVOJL7EdSH7VtzN1idtbTmPayB1zDJoLSG9iVgK7CCBjkEtpFKnLLpg3HGM9PEB8489eM/OHHR91ptp9bvH4E5lMf/DA6tvG5b58+Lvr8qnI/dGCU+K83Fcs7mbHex+MJy4WxZWt14eqMSMWlwaAodTJ6A7UlMcljDuIa6GX8pjDxKgW9vZ1TSsGLx2qlnfuXrHjXUgoImXK5N8BwJ8n1IIQGVV273zx+QfmZNeLFH1IcyYXIHhgZ6oJQMoygxpFJVcBz7iINJW8u41v85d8lNl9SkLqRsHqJvGBgs4Gcj6Rc/0bXxl0rKFxC0kewLF5/AvpPsKFxMXtrzXnreksOnJxqWpBwZIZIwWPARRgApBdeTONphU1JNtVMeKqYfg1TlXL0HJUtPm3vmjf85/9ctDYU2ymfBvGGIkQKuv0k+9N0/Df8K0C8hqM4eCifh/hC8ZFcXVm10H+/PWbUXH02LmfKCqs2dzgMNpgjwXJy7gI7NetU1T73iPBFex0GByvzjzl467x2//V2Gt7cP9SoMDxoQ6XW5kRUX/6+b2/JQOBalnbkYLpzSAnI0odceeHJFnG2PW7XnHiOEhhAE6TNoBUihAeXC82uiVeMWL6bsg895duYVjLaAEQdkfnJWZ5yTusaot2pBgFI68E/mFFhRg9ydgPIiDpKk+oJ5s6/6xekn/V+dY8e8wTQifRn8eij98ie7Nt8shHgRQWHsUHi+eh9zUQPwhhznla1Rky5J1J7FhACXAhASyg1I4Au+RJuPSRstnd9kF1eWjxuvb5o4zkXLOKUCENKKoHQYytISnBGgXZcz6ZapSUdUtN7tHhB2loAfSTGjkcQXTjr+uxePa1iqijbEwAj4YBGPZgo9n+ndcgsptRbARoxy6R6MCqUA+GsGR275aK7rqxlA64KGKjiAL0CkoTkDOIOjFd6eNS74cOOEz4GhDkDkYK/lrZecuehnX537q7bG3ARdtMHECJDP4/ZH5Ybv3pm9DdhJ5TkcLr4DveEhQFL6p38tfPHbf6n+E3wNKhYBGXpGWaCtkGKA4+Hbb/c/ctXZ4z8OsCgOgpZ0xuxjFs176y9/WeAtrfm0wsgwIIs5OC998g7f7n4cAeFXd5lfQ5eBe4k+1CVgx+C63/y73PHVWzk0SAaE5tKTACmACFwXkRGzmuLT/+sbyWRyDkY7RtCBz2MAxIJ8FB3aQTw8wCEar8fN7DjlR6ef9L2k71p+Og82kMX2gvC/O9T7gOv7LyIgEhsJx/BAx8+9t7frJ3+V7lNRR0K5CtL24bsKttDIkga5EpdR1dusqHU0gFjJEc0bW6ZOB08llKAATBSgJIHCzuMaBsANrgL74s2bzm6a+Nq5Z331Ix3tVynPg0pngeE8evO++spQ972O768JBy/9KoBXA7CfGuz78S958VZGDMLR8Is+pB9gE7EgdYEphU/rmg8fW11/ZTigB7wQa6pTTZ97d9XPJ7cUJ2lHg8sRoJjD9s2u/8Xf5m8nLdZjlOPmUJPsCCSHvvjr9L892lm1kQsJOA6YEkEiF+NgjENoA6Ys4r/e6n66vTVxchB73n/iaHVNbdOcy378Czs2cYKd1xgZJrgFA17X7etz3fc/GALJ4AGCoSRgML/p//4jLh9fDxYNivdKSaTcAAwTnGx4sfNm1c385GcYUA8gelA3hMI8FM1GewrSoUd7mhobG79/zhnfbo9HWkTBAY3kgLyP32XTL6zJp0t+r+GDAJNREXL4z07+dhsMoujDLSrkhEZOKjiuwoCQmOzy6QuNxJkAqkoAy3Vy6mIJHqhgFGikWhHAwtJqRuAMzDAMKpv0bzq5YO7sKz8xZ9bHIQV00YYeysHN+LjXya9/2s2vDCfwSGgavDpRlP9Fpu/bT0XVNi4A7RPgCpDWYBzgjEFywPIl3h9p+LAZjcwLJ/cBZXB/5/On/b/F84yF5BKYzABuDv6Igxsfkqs29fvPhNeSxWFIqvO94vr/uM37hiujkC6BhA+m/GCiMYBzgisYJiUzVV+8PPl5wGgOQWWfcvIVX/kib168wC1oFPIahRxBe3nIgdufpeD8h8tU/ANa747jrne2fPdbsYgHUMhDb5hghgFuWeCmCcZ8+NXvuihRO+nM8J4fdG8rzUI6SKEDXU4fGqJ85PhFHzsxETtBuh4omwdlbWwteuKW3OAK6J0+r0P2dz7etWN5nsF3PI2sVMj6EhlHIC0lslpDK43jjOTJ4GxieC8YF2bjeB3AJ7QCVClRmhgYCCy0foiUfrNqJ62NjeO/c/JxX49LzxJCgjJ5yIyNnKdxT37kBSnkljI/w2G5R8OZ3PO/0fmbfIuDJEH5FPQYCg/PADjQOEXHjrq4qvHdGKVr2KdcsnTOZdecH7kGvgBJG0zm4WaKyA76+NNK9QRA/SEwHjbH+6Mvu/cs66x93jLCILGSYKR2bliMEfI2w5Xz7TPOXVT1rv1pXLPmn3xqcvaHPuzYgGsr5HME4UhoPwsvv24rXkU29+DmR24183c9zKwEQEECsGFxgJsBuDAFaUyIJCZeczWApoPRUljo2yRdFus7xOnSPr5l+nunt78XSoKKNihXhCoKrFdyZL1TXB9qZ6+q3i5RUyVtDelohZwvUfAkMkrBJoIEoQhCkhnj6hOJGeEmwLhjq7jnYpcag0AF0wBj0GSCc9OIJRtq8cZhqjso+dCxCz96VCreIZUGbBd6JA9ZENgs/cIqJ/8KRoslD6uz+i8j/b99OY4tRkjAo7zAORuW1kBpBpIaV6L6krrq1KJyW3ZPkkxWJz7/wVn/GolLrqUCUwWQcEC2j9Vb2cjWYbU5vJbD2v5ES2/wf+5X/2OrOEhpaBk6Z8NFBh5EEizt4uNnqvdwzqfuzS9kAOg4/VMft3UsqnwFx2VwXUB5Gii+1K+d7i6M8t8cis1pZzv/98dRqwgCC1w+pWxaYiACtHChkucfb0WiMw9GSyECdqG314eecP++RQve2x6NTJSuB7g+dMGFlISXXbvX12ro1dwDAGhtGdfyhY45X47k3UReahSEQlEFbhCHafdvVFj1Ixq69SfuwK1Zxx0sXQh3PWZKCSgZpBMrRWAIKpUIBjiT4FZVxIo2VJf81W8mMJnc0jzt3dMmXwOtQa4Lyhagcg5cQeiWvp3Wqi8MG7qHW4MrFu0N9xn+PTB40HZBBSnhpUHgABxOmOHz1lN44sL9aSnvvLjjnSceTSeRC0A7YNqDyDtQRR/rukVP1pY7QjA57FG8B54Z+dMj66OrLJNAWu/kAQHjQV9fxuAJYEGTP33+lOQp4UL9u2uZNH3ObNay9FzhBanxrgv4jgJpAtO2z5gob3F7aM6fwvqHU3ilEywCkAapEAQ4CzQq7cCMtdZG649bHALfga2JkkuBUJ6NdPC+k6bGcW+b0PJWeB7I80GOD+VJeApYJe1OKD18gFG53SNROGrq5Fn/fvppX7tj0qzHl27PXFb0JVxXwZWKNjF/6C6j8NjXaOAnPxYDv3jUy/4+43sPKKVeLm1Cpgqc2NA63C3CysfSHWCMQ1EUxOpKauibClDeMfeod06LmBOk6wKeDyra8B0JRxHWes52T4qxK5bUhHuHem57X/XU946zRQoGGy2BL/k9Q6A5NVJ16t2RkYnw5R5zGKLxlPG+yye/D8oJfDHKBoQNYfvwi4TBAs8AlBsLYAz8Qk76zucb7jv/aGsRCQUyCIwjfGgYDPAUUB3VuGyBee4Lm/h9gP67kPiEuRdeUJTVVUpqeD7gewQlS5F3MIB52HdodL+SyRb6x2f/er9ZfVyHVjIgpw8WB4iC/jq+H4MVnzYbeKwm3FDEfuGEaJS0jWEUqA5STpzQdkZHLDpDeS6gNcgP2AC01iDOFXZNV9i/KWYaWDx1yonvmjT5mou0ccXEwXxTZsTBsFAY9KW3yvD672O5Z1Z6+dUFJbdDUw+C/KpSZnAp0RGmwaGFH0xeztgomDAGxjiIAYxFISPT2w7UA/9GESseS1zROu5y+D5ISFDRhSp4UEJDSA2tlQAd3OAdrGwtFFY+Wy+feQuxJaLMJc5ZUGgGYrBJY45vzpgWTy3e5Gc6Q4DbZSGevKjttMUddDxcB1AUFH0KF9JXcD1gW8Yq0XmKsXK8P/Bc7t6RK2Ofq4vkLRAPtAoGMM7AjcDW9gXhvKnuKd+KsWm2i8HyiFnEABKtJ5+ScQFDE5QIkjBJh71tGCj0pr5qGdm27P7E4s9cly9wGBRq7SVk0AQiH4lUcwsDqigwefZdlxQ0+QpwKdwRmMFKLJAHJZdMn3Ku4TgQRIAvQa4P5Wv4QViqvE3vPudkqqY6eWxz85nvnjDhPRfx6AW1g7m4n3Mx6GtslMJ+WBc77/JHnnlRFl/SUveCqAdBSkSmzKTa5XfMWER7DIDvKXDOQvKXsjHhHFIyJFItrUUD9VKh+80CKCdMaDvh6KrUfO35gNLQtgft+HAlQRFhADpbNnhjk7br+c6Tyn740mj1EpISLJyR5YXkBCCmYEw1jJmbghDebuFehotPbz3PjKQ5OQBTgTashIZyJDhpDBep5MAbs9SA7UNqzere1JozOrKLSAUbVkn3p5AQRCpCS1zVHN2ePO7JdblVADhjTNXX1SNVVdUoY1Pn6lAXkJJAYIEJBQGy2mph1FYBw6+aDYCcrS/Xxfv7s4WJzYwrQJW3DxWANuH6ER76rQ460nOoGko0HqueYxmLwBngSpAnQJ4EQcMI7mFp/Pa6KTTW142/ckbHO66pa7hmrk/zo8NZJgo59AglVwuRvt/Lrr69MPRkv/Q3k9I9CAoeR0JtxNvXpmPGLLfIGcL02oDXknMCgYPzYBfhXIFiM1u4Ga2B8kpmzxs+fHzmpImnRfI290FBVqMnAEUQLKDwY0E/yTHP/1/H5KpczFTxnDCYwXapWgUABYJUGu0sMhMGa4KifuySe8DZqfPZuRBuGK3VgHChhYBSBKUYlCYxpsAIQPvF4j0rax86Y3ZkEZQKFhUB3CBwTgDjkL5GlaEwr8Gb+SQQB1AgIjU8MozaprZGik9p9nIBZYCUYSYrZ+BMg4ymVDTZ2uw7w+arBZShnp4t1QOrXoompzYHXuQgj4RDh4lpEiDih+wGOEQNpaNtfNuMWHwyFV2Q0oEZrjS0QikcW2ZUlTmzIxaf1z5p4VUTJlz9lkjsymk5dzx2jMB1JXqk1n+Vzobf28NPP1nIrHal3AZNpTyebJnmKve32ZgR0bXa8wClOLipwsnKwAwDJI3QsQIoY1KjEWmaCK/ruTcLoCysTh0HIUFKB+Xqrg8hCFoq6NBHt+ueMzY7+6ZsZnXv+PHdM7KYpFDOnh78XWo+18rMZgDJMtNUA8CsjglTO9qMSRA+GJmAFgApKMGCYIvWpbQjYIxTAzb0x1+EyoFxOdqjhgCDBxsrMxjI05hQw9sBPg7QI6XvRmKpauGblhIEZo6GX1n4D2aSRasmteaHXjJDreGQncsKQIwN9voGoIgFsK0RplcoQHNwKopDLuk7RA2lmrGWhFQ12g0oibRUO++jQQxMl2ZDsDGkamtSpzQ3nXPV+InvPt+MnNOYKyaoL4OcVPSC9IcfcHJr782NrFztFddAql4EJSNDoV+o5MM64LVu+oXe9dCeVMo0GTRMM2SPYhSmenMw0iDWFE00LZ7n5LvuC1H5Dc0na0YiVZNcbypgBqn/QoBpDa116KUnpBQrhWnHNJw+lM32vNhYWDPb4JPUbtgVTnVoADFBUa6Q1EHkYec5TZ2YWFidknXwCSAJRhLQITUFEYhz1KV48tDjDgcuq9b2rHSoXsZpwBzVn4Ikt6DMh+B6hAUTIjMjUdHme3pD6YIZ44ZUjAk/yJnaeQOCbD+QNqFjs6cB96VwEJnDe5Mk7++xrZCUjhgYaSilwSjAKSe7qe+QfU6HqKFYSiUMz+PaF8HmL3WgqbCgbHicYVUBoLaGuo7LJ0654PJE3TtP9dVco68IX+TQA1IPSWfTbYWRlY/Z+Rdyjr0JhJ4QRLII0h88HGIxgLl904ubJ87uyQJTGkrVuzxMduCMQcMI0pB5DIgffRTDnfU02qLiDZvoNqWttaE1UVUvHadksEMLtYut0ZiIN8I2kpBqbLU1odQqJ7fyKqv+QhJyl5tOgaYbbMUEgwMxHSYZlT4zrtqeCqsIOD4YUVBPo/VO5uQIFOY0y7aSdjyWlzKQ5X2rtphrT56q50OGP8U4StSzQUEe0BazaxMmxX1v1OHpObmcFo7ve8mIaWrsdHAyANwEaY5o45LZ0ej32zxPbn+1mjQTw92RCMGzVViHI0HSD++fAInevtC0PHgz8RA1lHrSNZav4Lk+NDfApAQ0QSmCBDDBirS+9ahZH7os1XRyTa44oVgY1t90808UmXZ7fZFb4zldq/KZF6BUiVpjJNRGijiE4sy/AxROdq7e3LE1bU9psCxAh3UGjAOacTDDANMSWvmINC5dYMX/e6rvZLaFg/WG5ZWNcCNlCBlVrg/FOZhSYTQhmA0EoFkbDWCIhLvhmO7sfioxAM8CfPl3v6QC1yRCqCklWu38lAUnAe0EaaqMBdpJaC8wTSCTI2WJOEY1mzHbLIRAJieSO2AY8wMdNyRu1gg0YUGBP88ncFYiUQmkZ8eG7lqnd9jzZ6WU9AJtWgenyw0ASoISR0+M1c5d6PW/8Hy4SA55gWgtiowH+ViMfCghoKQAaQvc7xzQzrpNZYBycPeLAGbwsB3pgYtUGuQJaKnBeJD+XhpHrTVmIzrlVwM9tz+2o+vxAd/LgjFOQkpoXXKmuqEmUorUHNr570W47chC35ZHnotEENpj4eCGqiQxA4ybYExDmdPrko3HHo/AWWa8wTCElTvXYgwpU8oIfBGE5sLQJAOBh7k647iRqOdG9ZEAlAGmtzkWByOCprBJVNgnSoEQRv5RBgh81M+iOUoV26XVW1JvOAODRmMyUg8WqR9zE04VsS1t9MMsy1hXOqREZJAy2Lk9D5BK79KfQws3nxAb1hADlGIQkkNpBm4wEDODjFtWi1jzBaexIMnPejWnapjRJBAkeyopoIQEpyCPB+6zG4Wb78KhprczBKaKBthB9AUQmpSWEswXUL4KTJ7ARxGcs6ZoRoh0f6HwNPniWfL8J6D1MwBWAVgNYC1Gq8gLB+JoPSgNBQCMwlOPMcP7cNEN9jvDNIKiQM6gNQsqQzlBsygiLVeeY3Qvu1Vp5PEaMbJrJVBdXdM8ftbSc5papowbGR4iJX1NQc4lMWgkU1Usn8sqbpgGiMiKxiytiKKxVMSKJCwpleYsEksPDzixVHNDdbyYfW75D3/p2M6OwEPCmJYE6UlQLFiPnAikSmWVQEwxq8qwGkbgj3nC33Obt6zvm1Q9OJmxJhXqSIFDlWAyhpzWO+t89ryQfZAvghzyoAI00EQNBgGG9mbW1FiNlqHsWPuECFv7qRewwOCH4W+C1gxahCUGPlDwDaFI7zLZPQE19MqNdySmnX9RsZz7DghrbRSgFSLjrz6lpveWYzODW3rL/AEHP8+shglSASRU4EOTeUhpgNOQ6w/d8TgFJkPhoAGFCKQVGAu7kR7E3WYRU5MKnbFGACSMgk1OgjCDrKqFsdTC+3P5ZeG5uWXW8Zi7KEwAGN7x9Iqm6ZsHCdOaoAWUQBjGC66WDAMgE1AuUH36vGhV+0I7u3Xra+GcrapKpqYvfsd7G+Z/4pMFftTUrM9gtQERFqRFRyzAMgnc4KgLuiBAKoIQCsInOI5GpqBRzAh4toKKRmA4Lxdo3Sf+13OcSLir+QIoKsA3lYz5XgAipHVI5RGYheNgJBakamZvs4sls2fMANbTOps3UGBA0yidYInQg2ACGOa6KBm5gdNrVNVnjIfRjrKUdyIYTAfER4wwsVamJtfzlqEsIqH2OWbmbM+wtRYq4HZhOqTJkISSewIeMOTH0q7W9q5c9ED3hr891DpxzQ6ScycquGCGCcZ4WEhigCAhMD1Z1/GBt+cGv/C4LrHiHax2AkBGJk/zPQSmjudC+iH1QO7OFV5+yyocOD1C2ZKmXd3qtBsw7kfSxHJFpRHxJcgcPa4mwGQMihTm8ej0+w1WC0WDOMLRWA4ATm54e8J/5knGjFCV1kGKsS45zFho9jBo3mRUTXrbpTgMKuWBI7pAVXWqau4p7/3Q3Lc9/LTT/rMfrOudNXXbJhe92310b3HRs91Hf4/AQL9ANiNRzBfhFLNw7RyEm4P0CnCKeRSyeeSGsnByOQinAJ15qCf7wpXfH+l+6l5N2EkB15fJDqRzxZxWQQGeljogniqbG5yANoEWAKmxNgElyC1w7fAwd0NT0OfFIw1BBEEEyaDAdtax7NyN8n5qGB4DUyHBkZZgCKgQjKCLB0xOmD8lNfdImLNSww2259JuHUZSdMi/BOCZLrVB+Xp49wWRy2a3O5t/dHM0ykFCg3wBLXyQliAKOFY0FSGbPnhBqmXxeSHQH3TEp3H8pEnx1qWn2nkPSniAyIPBgOH9bYPTd9N9FHDfHDg9AGOh32oPhjZG7dX9a01mUcHwldDgUgZOWQCmUToM4ZRIamEyEp2MQ026O0g5adoU1MTjo4DiK6iel355q8kCH5bWMgwpqsAYZyyokmQGpJTg4951VrJm/AmhE88cy5NlDFay9bTr5l756PM0/Uc/2TE0eXZm+1rb73s+I4ZezLjdD/Z5fX/r87t+v6G46VcvOZt+/XLmpR+sKPSt7rNtA76vIFXgBfe9oPG7ZytIT4C522x/6+dukfa2xxHQBGZCxxUGh4dHNkmvlwsN7SsoNTrmnIXNuhiwyEweZUXM8dgtsnK4xTA4YlYUKkx+IR1k6+pQU7FJoVM6W0DwsBuR+HNr80+l+70iQIASgJalTnUwDIAsE1FD4ugWvwMwUmM/ppyBGTu3Zy0B4XMIh6BcgksmXkjzVwBV4jPZZSUOrrvpp9H8n1cRotDKA4UUhazUtoEzeKoKjYu+92+19Y3H4BB6pbYdfdW1A4XxTcq1QZ4NISJg/to+r+d7t0k//wIC8qL8wWhybJf8IYRsWdipPB6IbE5nNm30/G2G1JAiSEqUxKDBArpQxtEuecPJqdrTjxSgNFdXIxoi2s6Jk+l5evnEuZu353THJMb8wNnFSmE9A2AExhQYkxDGtESq4zP/ZD/3qadpD/n8h9XEqa6p40Zi6pYnb7gv3f3sIClbaVFwSdkuEbRwsw5jTIEZUinlcs7IgPamn3fT1/KJ41pilgfDYBACKOQ1fEdAey5ISDB/44iwN69F0AJhEOV8Jgx+p2msXarUsVoTmArqThQBBhiinMFRCtPNSOvESHzKZj+/Entp8HRYfJma4CtJLNyFpCJIRnBJwyeCAmgredtBO+kOd45H75C7uStT318Xy04FGYG/gQgGJ3CDwbAA8jROnkqzG2qs6cNZtQ1jmbxIROBh+wgiaA1IJyBIVwLwFemBvCxVzP7d/XRctT3z8pf/s3rR0b/P2A0WtBNQ1moOxq0gJ4UcFCMnTBh/6k0/YI9e/Z50Ov3igV7TrIVnnROb+bl/7dniQHk2lM9guI9t8Xb8xy1esedpjGonh2GsaVdNZT8yNDzct36G7lyo0OGRArgOc8UIBgv6rpkSeEus5pwHIkN/hC+zhyMcvG+NU+3MptiJ2tL3+kTXz241jEioMAeNjEZ3FQYyGLjBoZULs/GKU1qmn3X5WGspuWx2YMXdX/nX7c///Ev5gRdvLAx3/s7O9d7hFLP3unb2bqXxoFT0oJTyb0T0uFL6YW5gpcFMp5gXKBYItk2wCxpuQUK6Hki6IOkBMusBfiYMo+1aZasJf9mxY7ltRaCEhpSlqtZg8A3GwDhHnWSxY+LVi0OzZ8xMQNLEiTQrpasHhF8EHwRJGtvgd/cztR2jla87r6VYsDOPr1FPgwDpKUB4wW7OANMEuMEgjAim1zpVs1txVGj2jNmYmgYipVAiaUB4BCkAv0AwNdBZtHo29LsbsQ8agqHuNXdnX3jXZ6J6axEUhfBl0J3R90F+YNqRl8cIO3de6+m3/Kq2ftzx+z0vDsw97twLW866+bc9AzXVfsEGEwyG/Zf13vbP/sor9jwB4BUEzthXV5UdgulBu/I10SPpkSccbkJLDa0ITAegwjmDyRk45zhJRmcdl6w5BUHm9BGLyO5yOdktt9wU02uHlWKACNPNKTTHQ2JhGAYYY3BEDaz2L3yiuq7xGIw9rQGFC6UvNE26gJ09b/pD7WIw3DWyphVx4smmuJMPuDCLeY1iTkM4EiRckHAB5UOLERt6Zxz+71TXZ/OZJzcJb5A0g9QEpcvNHgbGABMMpxuJYyPRyGQcDDfGQUoqGk1Vw0hqCig6BQXaiUcB6VIn87fZSmzHaMuOcv0G9zyVuRcqBiYD57QSYSyLB21zuMUQiTO8bZF5EcDrxxIc61J6QnCXAt4M6TFIJ/CfmAbDY120Vkrq3k9IVgzvePqnztprPx/V6wpAFCQ8KM+B9AWU70NLAeXkMKzPmjfu7BV3zj794/81rrlljmWZu5A3VVcl4lNnLDh+yTU//kXrOX/4Y096XGMxXQR5PmHwhhX2ps/+wrPTK0Iw6UWQv/HqNXI6tMT9+wZ6/9LNKE8ybMrna+iQLcA0GDgHGojxj9WNf78ZtaYipGc8EoCyyy6Uz6Zfrt7+vZ+bbT/8nJJhViULvY/cBOcGtFZgJgOUB8c4cXz9jOuuKzz95Y064EcYK1b8gyrCI5DWWkOqoCI1WERhEpBWIC0AZkGLgibae+p0OpfvfKDZu/+fdfTqnNYhvy4LOiMxBosxaKaxiMVmTI8n5q31/JfC3eCwq5fTmsZNnMgiLb62oTTB0RoONFzSyJJ0V8FZBb2zVcTfLcKHnneWP9HZuPnkCfmprhfY75wDHBqWoSEtBiWBM4/CnHG1sVkDGbsHh5m5rSQNKXs8jKCCV3qAbwO+Q2AK6PEjxXu2mY8C3sABRFDcTP/qm5zCJQOp9o9/itW9/QQto9DaA5McZFjgRGDQyBrtTbXTvveZ+cd9/gNq6MHHdX7zOs7haBatq5t8wkJULzg649VW9fdKZAc8SNeD7vve4/lN3/mtJqxFwKA/8mo0E9rpPClL8SW9i2/lQKQ3k3nlsXH+01dqdrZDGmY4ljurEAwGqYHTXLPjkpqmd9wx0LMJo72TjpyGAgCZrX/8eVI/u1kjCtICJEVQHKflaFEa42DchJI2vLp/vmzy/Cs+zA6RsHes9Jlg52W7hez0zqayYVEdhSHWvY7oH7ODtw8aDEzosCtASEDFAZMBBIZmzcxzI9XngqERh9DS4kCkhqEt6rpRqQhCBdpJPpyMzzN3zRbprAm1tD0SM3tOsffXy4t/ADcD881TID/IhWAmh2ExCHBMb5Gpd54SuSR06B1+LYUlsbgjOhUyqJb1ioCXJ/hFgknA48PRV7YPuZ0YLZXf3xotesXhezLrvnyd2HjNN83871aaatAnRYCSUKE5pT0XhbyB3mJrHSa+++LEMf/xmerF//Gl5DGf/5hddfopw/lk1VCfg+ygC+UA6PvRM/lN3/mNJryEoLfPMA4n+ZSm0SbLB6s7SOXeI4t/ti0TTAWmuFKBBs2IgbOQC5c0vhhvee+8hsbzDzXa9aoBpVi0N6ruG/4nyovQmoO0gpZhpmh52IsF6c6uikFN+NrHmicvfMuRiPoc8IUZBjNNDYMHJMiMs3IXWHnMbp8TZNXw4AN3yeKDjBhcSfCFDiOvBA4OkzH4RLiApU5qSSSPwUG2tDggsUycUtd0huVLKKHhKIU8KXiakIV2H0PxSWjqCnfQvebC3PZY/lcvbo8OW6Tgewy+DyihwSgoCjWjDEJpfOgM/ZamusgCjEEG8PjWmpb57fwYOD6Up+HZgGcHPGt9IlL4v5XyHpDaEZq4B5LjpAE4StHqbN8z3892/senvc53fgE9n/4dG/np4yzzp3WssHLYdDqLyK0t+APrssObn+l18w7ZBR+i4ELYHvIFQi5D8ByCLq7O2FtvuFMTXkHQNTF9uMCEys2dkBsYcjR5+UDlkf7eex4z1CsUMtYFER8dbKYUdkYwGFo9nfpq3cR/a6irPQZHgCBtjwfv77z3l0nnd39hiIBkkBxAItBUds4vBjDGYTCBvJxUlTj65v+ua5l13r6Oe6REKyF8J+cYphn0VCnhRilWCgpf0qUxZvsIr9g/LvR/t8eCC6UhtIYjJAQF9RMGggzaqWRU/1N183vAMO5w26yNtTVN58RS58mCgCc1cqRQIA2pNR6iwsPbpLsGuza02qOks966G/6CnzKY0K6E8Am+z3ZmAXMeVJhPrRfV71uSvBbgqcOtcZ1zctupbXUDE+BriCLBHia4OULMBO7cZq3sGnZfDH1lB9UCI7zuYSnks4XMtpuyXXd/Ob3hW18obPjkF4trLv9s9tlzPpd54vR/237X3E/1PfXFP9penLkewfcB22WwCxpOMeSPTd+7xnOyazHauvOwmQqMCFwHkdMg05mX6PcOMliR3/I7L31TMcLhKA3f11B+AC4lQ8IAg8+Bk2zM+FbDpG8Z8Wj7WPs793hgXyLbv/ob/17NntqmdBRaBFWWJMKYfynZkgEwOAzuI+tPr6ld8NP/rmmYcDYOIe5/eLUTy4gnq2MU9iZjLMzdKLEEl9uwByAbR0aW/4oKN3sEuEpBEMGXGh4oJC5nkER4C0udfmJtwwXhIjxs5sL5U6ddOm3YmVYUCgWtkKPgHDYwb/MKXXgamjYj8GHtNyP01icKP354c/X6lCGhHA3pKEg3IA0CD0wfpSU+uoQuntVevSScgIfHlOVJXHa8ugpeGsIBCiOAmwdMH3hphA3e+IJ7L6C7cJC9fXfxPgeaxDCArURYJYRY7jrFe+3C4J+KhaE7tVYPNi/45LH5HFAsEgqOAaeoYBcZSPmAkjD0UDY8xmEtLwnLGAP8K/XlJn3IpJX39XTd9EhEPmMS4JKCrQJfIZU4BDXAwSAIuMgxTvjP8dO/V1NdNWcs1+deD1rMp1fKHV/7eoJvzCtlQAsRRH2kCP5Wu5o/DA7yxokT6o+/7We1zbMueS1BRSmhfS/vcmOUIGonmWdJHyEVZgEfkPi/6N/2nYcT6rmo5nClhqsUfK2hSYPCBLNaX/PPVo+/rqW+7vgQUF616VM/rqHmndGaD4u+HGypkSENl4Ct2u35rU7fmVailEeTOxATwbWd7d97KPGt7nyVNHwBWVQQtobvELQkMFLQBkdbTTHx3++JfSkWi00+XKbPBadPOOvCeUMXI+fAzjEU0wxkEwpkim88b/4xY6tnESSMvZoq4VLZgQiPkwl9S/0AusZPnpGK1B4/M5tVyOcZinmBQpFD+kHbUQ0AsakNbNfWpYfJscfAwcBgBCY4B2AEPo8w5YsOZqeTnt/3zUzPlzdylVW+RlFqFEjBVWoXRg1igNTAh73YeT+fMPPG1vq6k3A4uW8YAwVIue8V1b3pyZvFlk99LR6xobUBLTwo3w+0FSUDc6jsoNAF5GjRhIZTlv1m/IwlH+BHKjV/D2PHDYJhGeBhk26uy7hMiMJwuD7gwfN8sfHr6R2fe5qcTQkdoL4jNYqa4Iep8A4DFtho//ea8V8y4pF27EYjcChyVcvETy7YmllcEBoZHWgoGS3EQyiu6JXeGgSNsEs1JQc0/Pc/vvHmj95mXl9QMXCpIRyCLCpIW0EKBpIKjks4Z2Z61pfeUfVVwKx5taBSXdsY//p7I//PkN2mnWYoDBFUTiPrmd7nnzZ///QO8QBG25+KwzcTdgKMChaXFfM9HfcdCaeo4dgs2NV1wE/LIMHrz19U1ThtfgjQhynQwGBwixksEvIC82DSGAw6zsFiHOAHvwFvHR5+8Bv+wLeyMUNyTfCkRkEqFKWEqxRUOOeJAQWlcXpWHX1H8/Q/njth0nUwjdpXe1XRSCQ1K1X90ZNmzrgMCOoV97nZi2LXK6ZaK4yqU06SKsYZCZR6lu5kAmd8J3kyg4Qnk1ZywmXn1SSLtfbg86uV1nkcwSZhkYgVmbzwve/P+i1tTLtQisF3FZTnhQ27g85mzF/XJ3NP3U+j5sK+diNW9PztLyWNkZksenKjj6QoUQgAkGw0R+UoxSfWNtZPesLNP62FzB3qLnfR3Dnvut5NfEsMFq3h0G8yqIX4LTJ3PaZy94Pwcpl2clDFfJ3d9vMjaI6fOUWeyDwRlBYoAqmguhwM0ErhjKP07CJvqn9ybfHhsCvQQV9LPFnPb/7S5J8smbr+Ar9fItfPIIY1hvOW92/PWLc/1OneDWBdqJ0cnhyPvUhdXX1NzYxr3pNzEjGDByFlMA6lWMCtwjSI1Zk1rYsWmPbja5xCZhMOAz8MM1hV5Oy6a82GaD1pghQuyFOhLmWAMwW2gVZRRq1FwJ52oKaW7tFyczZh1p8oo4uggqpjBcDXwRrdGcZkDBrAOE8nL03WnTexoX7RSCruDXpur5LSOfBr4Wioq2lZ2jz+iq9Nnv3Dbbl84nfr196ilMrtF301wXVzW16IoJMitSedIFXCAPlBPxBdxquBgMWcc4LBJDxhct50yfHNk486WeWe3+oW01sOynHxKsTgGuNmXPKOvJ4+xfcEhC0hXR/ad0CiCFLFwGUl1vXJ3NPLKHACHlAb0bRjb3iGudvHW/H5jYrVK1Xa+oIrEyHCHCvMGXV11dOelc4Lvi8GDuq6LRNvnTXzg/+J+h9Y3bnkMClktcI28ou/YOk7n/TzD2I0N+JQd3T14lbn+R5RGzm2RR5Ty3zDF4GDNijQC4GFBC5YIBdZ1XXty1+w/waQfVAO5aamplu+MuXGS+aufZff6yI3xKHSGv1Dlvf5p6zbHtrg3osgYawbQbn9mFbHusXhfOus8y91rY42DgluBKnHDCGjQ5ib4xkdNbUTTz/L8l7ss7Pdr+BVlv8bCauNL6m6WtdSnV/MQxclYGvAY4AgkKVhiYiPTfpxHfiRDnhMtVLFtXb+xeGo0bRQR+eTIHilkgZQSM5XypAIOsPDlzhGm9MuS9W/9bjm5rPqW5rGZzUpRE3ShiG0kDvNZyseM2oaauujjI1bMqn93Pe1tv/rl+NtN5zq8it+mel5+GdbN9yglOoHdnLw7VeEl9/yfAxrcpFkx9ESE5KkvSA9X43mdgSJHTxkIQe0ciEj8yY0zHzHlbW10Yledv1W4dkDYw0opgGjZfbbr007U9u9ggvpCSjfAYkCSOQC/wlMMLmpX+afPChAAaDzQmx8jIrrYxGzZZq2pmgNeAHTURCuA4PWGsf5ZsfixsYzBhOW3yW9zVqqfZslnKNtXGPHl2cv+O5H08bnWG8+kSONnNZYQfbm/5WDt60V9hMgWlMGJofqNCSQdl/aVnjyxaF4/pj26PHjuBf1vYDzZSeBtAagBc48ypt70tGN52zLxLPb+7x1+wt0RuJVkSsvmPHWX/9r7DcnjF9/qt/nojjModOE57dHhz71sHnzE1vs+0MwKYWJx5wBUCqoWBSNkdbLzvYcP9DKdBAdYTsJvxkYE3B1W6pq0jsurUsMR/IDq57RAY/VQW+IFkyj9l0T/qswyzlDjjiMegXYgAAf0tA5Ae5KGIJB1/F6IxKpap7a2i5swcyEVR1PJFKxaDyZqEpUMYNFpS+cPY8lcq/4xRd7UmbsaCM2LybIsEnD1wSpQ5IoRkHvch0EEwQRTFuwqa4ef4ayzri8btw7L2uZcNUZTa3nzE/VLDm1YdylZ9aPu+xtrZOv+Xhd2/Xv4rUff2shcs3xw3LhxnRGfl703vTXkf7fh1G5PAD/YG6OASCZqmm7zGr92Kdk4i1Ha1JgUGDcADNMcDMCZkbATBPMNGGYLNBYTI5oPI6ksT3tdd34m4HVP/mxnc+u94UakwkUj4LPvfjW5ZtGlpwu7Ty0XwT5eUDkQdoJ7FeWAHf+8qLd9d1/0YQXEeRwHOjuyAFEmWnMOzNV/7636NRFU4TRZlJQSxFlDBHOETU4qhgDpSJ4ssp46s8o/vaRrh2P2Iz1K0Y5IbUXs8xEgvP6KfHknEvGjb/sTN+8cHJfsa3gBibOJvKc21Tmkb+KzBNFrV4JfSY9hzECYQBItDUlz/3MGdZnL5xkH5tkPiQHWJTDigNmgsOKEaprGTwjJe9fl3riry9X33H/iu5HXJXI2C6lOQOPRpBsqtGNF582+ey3nui96+i2/oUsPwhvQAMOw+auiPfr1fHnfvK0e/dIzl0FYGtZiPiI0YnGokbz5PMe+FuGLTlKebldojCBe52Bh+5FTQbiMRNm9qYHup/4xHW+52ws888cUGSn5pRxHyhcQd9WWtSyHgXKCZCrd/sUgcc40GCBRS3fQMSNJiwWLUY0K1Iutob9DX3ysR2rt/1qH853EwafMC9V8853U82H5ihrIlPEKcx3sRhD3OCIhn8bnMFkHAZYQH+gCREOGMzY2eRPaoLvSwghQcSQZVqvgrvt/8n+27b5zsMANoYRxgKCwveDnnwx07IWJ5rf/lFWf80FkrUmARX4UDgPQcUKno0AWLjBYVoahmUinoyhim8aMnKPLd+x+qZb7MHVTzm2PSAkvWpV1+RAQ0vb+OZpSy6z6z77lf6B6gb4OeidYOIC4EEWCk/BsO9aZXfd8NlDAJTSLIgAaKmNRk87LVpzyUWUOnuc5NVJ4txiATVhhDPEGEMVOFQigpGEmUknzX4/bqUFkZfSqG2QvLU24zRUFX2jaPsoELCN+c5fKf/i3TL75A7hrAFhS7gAR8LoxeFcgAYAC8ycesqs5Ds/uIhfedK4fEeVJSEIMFMcPMYQiRFicY1YnQlE4nCoTo6I+qGcxwYiFjOrLFFfnxgZZ7ICRyEPFDRkkaNv0NR3v8jW/fhp9sDqbvEUoLZglC7CxWvQkqVh/KyLkgvv+F1Rjq8i6YYDGtaqGSZ4SBPBQFBkgltJ1IgHXh5+7n0fGR7oXlEWpt53lG5m0zni/MgP82Z2MhuSkvKhesBKyVAoz7gkMDAe4VzHDQ6mDWTVkLmeP603yke0ox4JN5R9+ZkMALXxqHXqWdHat1+mqy+qk0gZYNBhYCnCGCIhCb3JGCwK+kvzgGsrANIwJUKHtWKCCKuZ1/0HZB9/ws0+JbR+JdSS+8qjcofiz+BhSHR8deOMK6yma94pImfOV1RlADJoXMZNMCMCblpg4YMbBgzTADcBZlqIxiwk4j5SbONW5J59wul74rFt65avsCg/UCy6ac8T/v62gKqkZUTjySoyEnVtHaedXDX+1HNE8uzzeocam9L9WcDPgPwiSBbDyk4zKNtlLjFKZ/3B3y7z0sv+D8CLoflwsBObhdGPBDd5R5UVWTCdrEVnmTWndZA1pUkbkSZmmhqAxRlixIIPh4WWBgu73mkgwzTSjMRGJvqX6/zax0T+xS7pvhJmwJaaLpW0krFYgKVrqYonYnOPnhA7+9x2cdY5k8WChiTF6qOCGzGAxRhgMVhRDcMColGAW2XLiwAojr60pTZ0IXP3y9aaB9apVat3eM+EOSZ9YY5HqXnUmNISWiZnNTWpFDMTtQKxusZxkxvHTZg3o1gs1nixUy4bkJceT8LZGdZl3AjmbAgslhlkiEsJkFGNanquO7fq2o8O9a67t2RF7fOmNhiLiWMRXEpB6+jOJkp/z/07yrJX1qyLa8MnT3cTaFNoGqYPIKLHAcSZwac3xxOnnsgS53YIc/oUFplaTdw0GeOlQmcDQDRkvDNYkLoftPlj0CAMM+XuYKLvAZV/9mm/8EJRy/VhIKCn7Fw0DoOD1AKQMq3I3Ehq6jlmzVvOo9S5R2tUW8FRA1MIRmRUWzGscMDMgIfDMMBMA9G4iVgUiPDBYsoY6pH+4GBx6KVOUw0ORE3mGFw4DFqAce650pKIJI14XUOqdtqESPXsjlzRHJf1W2vzOY38iAPynKB3r58HyTSZvCiU3z8Csa0b3urNwt7SzWlkwCsObaOAuHfzQfhQ9rYYLQRtQJsiEWt6jBuTZhixeVN5tH2yEZkwV0Wmx5lBkaBkBQZj2iWt03HurxHFl150Cpu3KLd7iKlu1xc7Qk//UNni83BkzAIjBJZqgI2vTkXmzGg0554+3Vpcn0DVca2yo61aNkTj0HGLmOSMpGakFDDoGcXnu/jWpzfJzlXb5JbOQXR6vtgB0ECoWZX6voxZ/+TqVDyeapg0bfJRpx2vYlPmGVVT2qsa506z/VSTLWvqi8WI4fpR7tsSfjEL4XhhF0AdNm7n4IYFFomARaIwzaCqnBRBEaApjmpzUyb//Ds/Mtz94p3htaj9LO4mALXYtd5tJ1cbds203N35q8MoXiaco/4BztPSnKwGwwSTG7NauXXUbCsxv1kZze0sOqWJW3UKpHTYbtBgQZuBPClnHfPW95IcelnZr/Qr0aWDthvdoXmTLtOSafcffTXCw5tUxxlmWcn2k826i87giVOP1WZbFVgCYCHNP+cAMwIfi2GCcTMINxsmmMGCRB9mgpsGrIgB0+DBADMG0xxNm5dCBwV6CnBdQEkd1BoJCVISTGbAxI6iLLy0w8T2tCyu20b+ps3KG+j3Pacfox3jC+GOn8Memou/SmCJhuBSDaDGipjjU4bZYAKRJLGEBkhzRjZp1ybyhJSDSqp0eB65cLBsjBIMHWmTgJWZdDEAKYDVcsNoaKyNtzckqTHKdSxpqaQtDd+R3FMaqj+rBnMFtxegHEbbNRTC6/ExRkQ/UZNbE2YsPq555nkXJSeeu0TGjpqfdWpits3huYDjAMInaF+DKQ/wBzX5wwJaMlKO5kxCUdKEUW0qBRiWBWZFwa0ImBWBYZlgUFDEQUpBqyiqrS1Ze81VHx7seumu8LrkftaJuZs2cjBSyqPRh7hGIwh4UWoANICxcVHTaKxivFYTuArwhHEGDsZUXmtHaZ0hrUs9e7JlY+nuaxzZYdzVogBqOcNkK5qcbaUWHGtUn7RQGzMnwWxpUKzJYkFt9c6IRgAqpTaSFhg4CATGjOD9kMOeMEoPHjTV5mDaA6eM0iLjM9mf0aI3g+LK7dLe1kPeK5t8Z6hPa6TDHb6I0R6tDnZt+DwWbHNsp5NsNGPWwChfCiubWOXN1sv7C48ZC94hjm/5+Ztlr/E9THoZXkvJpBmTa6muSlXNPP5tVzYeddV7qO6E4wbzVZHMsEAxBwjBwJSCIbqFKPYUDbm2R+df6SmMdA5C9IxYPJdTSnjQvk9E2jCT8UjjFUuo7ppTpIowbhCYFYURiYaBhrAmTBNIKmhtodZ6qXf4uauuyY3seBxjR91xuOdjaU5GwjVrlY1jaZxKY1faBPwDnZNsDCaeBSABoB5Am2mZkyLxSdNYfM4cMzGhWbG2Bq2TSSPW1syNJCceYcRiPIhCcoCbnDOtARGkd2hfQblC+cNpzvOuIbcPK78/K+zuQcjeAYj+Ieln01KqPEY7xBd22xnLiZtfy4XKd3umMu/D66ETI9vD3+XXQmUq/JhdS8TixsyF51zQsfQ/v+LEFy4cTjMMDXiwsxLCMwA/rZFbvtXtu+tFXVj5irC7uqXwhxiQpmBOuGWLpGRCkGHw1lTzWVej8aNXSmteg8ElmGXBsKJgphXQ21FQh0NaglCNSO7GR0Ze/NgHhcSOf3BQ2X3c/q5/0y5haOzSOYEOZYKM1e6cDFRm1DCgmoAa0zRrzWh1HTOqq8EiMU0Ri3SYx8PjJmdSMSp4AFOk8jYpxxG+U9BauyFIlLgyXIy2SfDKNI9yRNV4g7dNfTNJY0ND46JLvv7tqjkfePdIzjSGBx2kBzWcPIN2cxrZuzc62/53mZ994UWlsT3UUHO7mZDldTq024ZYn6yd8pbE5C/9ixs9YyrIBzdN8EgscNRycyeBuxIa0YgJufHqL49sf/CHGKXffNMKOwLHpzIVuaT+R8oepdf5HjzeuswUkGUqWLmJUM7mpg7RRq3I60CmdMyds/idv/6NW7VgQX7Ex/CQwlCfgm9rUGF93tt8/d3u0IMPKY3NGO3bW+7QJuw/49UAkIxE4ycmJv3zv+i6jywFY+BmEExghokSdaWWClpHYBXuXJ1e80/v1YQN4Yb3pp1/R4phrRwY3HCnKDlFM6HXeCTcTcofI+H7ufCzdtkEKQcX/Ro4LityBGXqzPlHL7r6T3/yk7Nn5zM+0hmNwR4FLy9B6Ue63fXX/tJOv3A/BQxrWxBEI/J7AJP9CQGQSsltIvPkyqpYrp4SJx6lKcqDJM4wbYQoLD+R4EaihhUfWiPcTCfGLqxfAZT9DNruWsieHnq3x+sa+TuWLv95w7Rra0c23/RiBSIOwsxpbG45/r133eUlZ8308i4KeUJ/r4KTdcCLa4vupk/c7OQ2P4qgwLAbo/k69CrmpybCiJd+4alkZLiOEifOI0Q5QGBGUClMKmiaplFlGv7aQS+39mkcvojh61J4ZboeMTAxAbwfwHsqd+PAxWTAsVd85ztOcu4cbTtwHMLwsIKTsaGdPFTv9x+wM+tWIEgB78WBU0cemKZC6BrZ/PvrzZHv/Z6bEQAMpFQYbWQgUtBKIlYzcwYPck2MN/N4VQDlyEu6cgsOXKYvPPs8o+3yq0TOg+MA2axGfkRBuQrcfr7XGXpgRWji9I6B/4IQNFfuT2/++b/HxT3PMiNouclKfXUo6K3i+6ZFQQBiTDtIVgClIgCAzmVLJACrc9mSK97s98KyLMQTCcTi8b0+orEYknEDU0/8+D/nvQQXQqPoMOSzgPICki9deGKzcAqd2Afb/+ECFqWw1e/63+/ErBFFMEdhS4chZC2Bw8TS97rWKCtL/bU3hUKwQcfS5XMAfCwcl02dy5Z8czeT6TMAZiJwNN7auWzJ8n0c9xIAFyJIXnIB3Lafzy8B8HYAHQhqNX7RuWzJYx1Ll6cAfAfAfZ3Llvx5L9+JAlgP4Aedy5YU93L8iQCuBTA9PP8nhp572817Ox8pPLTPWLzQSx57puf6IKXhOAy+T1DCA9MOtP3CRj2aBj7mfots76q7myavepbHzj9B+7lR0vOASKU8SvmmTVOoAMqR9aGIjqXL/9S5bMnlu78W7rIf2u07nwUwH8ACALchSIMvyYc6li7/eeeyJR/c7TsTADwLoGW3U/hwx9LlKzqXLTl5D+d2O4DLd3v52o6lyzcBmBACRgzAn8u+8wSAk3b7zjc6li6/tnPZkpt3O/6PAXx4t89+qHHxH/4bwCmdy5a8vKd7pmLtx9i6JeV7LkAMngsId5TKkzHDA/6+l/NYiVBwYvTCM8K84ASSPGz1FNQBkRh2MBpIeNOGjSsmz5GXmj28dlkIJj8FMA/AXAB/QuDk2xAu5O0ALgUwKXx2AXygY+nyM3c7VglMfhEeZxKAUwGsAHBSCB67L/bLERRILkFQgzQJwE8ATAvBZG7nsiXv2Q2ATgJwR/idSQCuD9++qWPp8rlln704BJO+8LwnAjir7Poe39uNKsi6RtcFfFfBcwm+h7A3FAsqxwPq+FIG9BFZxHXx7HbTojL/SVBp4OY2bqPXiIqhoqFUZE9yWueyJY+V/f/yjqXLewC0Atip1YSyo2Pp8rcDuCs0Of5WZjK1APhJ57Il/1T+eQAndyxdnt6DJvJhAG7nsiXTytcygH8qi0xNA/BymQZ0eXhO5f6gb3YsXX43gDUAvgKg9F4JiI7rXLZkR/h3F4DlHUuXbwDQ0bF0+TW7azUAUHATyZgNkCBoMgBSO9vjMm4BkXF1R3pTZNrLGDyoLwt8JwSuRxTT3aVezP9INVgVDeVNKit2A5OSlHh4r9nDeyV/SFPphdB0sEpg0rF0uRmCQklWlZlaCP0jAHDfXs7rhvD5krLX3h0+//vuH+5ctuSlUBO6sOzlEiXagj0c/33h57fs8ddJQXiA51DQAF0RiDEYBgPxKCI1x3aYBpI4nC0h9gcokZpmFvCbBnkoRID30kaRX7sOgWPYfzNP5IqG8o8h7n5e39P7e+zh0rlsiexYuvyLAP61ZF51LF2O0KRp28vv1O7n/Mr5PhaHzz/oWLo8u9t55AAsAhDtWLo81blsSQGBQ/c9AP7csXT5TwF8vaSpdC5b8jiAk/f2o1FLKukTfJfAOXbmfoAbQR+bqtNmRasmzJGZrk4E+R9j7pgtsPaZQvKgjYzWgCpomb77aaWolFD3pq7lqWgor3+h3XwiTwD4WggmnaEGsBnA1NAfUg4+JX6LJWXaSrl8LXy+p3yTDp+XhL6fy8PHZQiiOLHdfuPl0HfihX6i7R1Ll2c6li6/PYwS7VXiavMOkjakIAhBGGUg5mBcQUZmJqMT3n8FgvyPMd8cGxqbGpPjlpzm5IvQwg3aljorN4vCyhfwGnDjVjSUioyJFl4GJtcgcJbuLZqzAUFYuFy+CuAboV/mE6EpNQPAR0OQ2NS5bMndewCwJQgcwHsCOK8UCg9B5c8AYh1Ll58ags6FJSDqWLr8pnKH7y7awNBLK6unD+YLoqbKYBLEg757YByMGyDtwGq59uxm+7Gr+zcv/x/sn+joVUnbvCuvHihObSd/MGhy5+/I6OzNy6RfeAVB7Zn3Zp+MFUB5/QNJuYZyafj8ob18p2sPgPLrEFBqAdy023ub9uD7GCrhRKjh7A5aE8PfWL4HH8tjAB4LPzcHwIMIwtO37wZawQ91b34hsf2HvzVqvvxPWjghq5+xM8uDccDXdWbNUT++fjy7drhn05O/DE2fw64lNI2fOotP+PTnctsLIN8BSQ/I/eFpN/3iExhtA+K/2SdlxeR5Y8q2vbkl9vDaswjY7E5DEPq9CUH4+rTOZUum7wE0ngif372X37gVwENlAHN7x9LlP98DuLwM4OzdgHAX0QDSG3/107j/xA6lItC+Dy08aCl30rNzJpD1xyesOb/7TnPHeR83GJJ78i29GqmubWxvPfVnv+vqb2jRTg4kJYzi7c96g7+9h4Iaov7Q3EEFUCryujJr9iMvhM8f24PmcCZ2S0QLoz0tZUDz7c5lS97TuWzJh/cSdQKA34XPn9uLdnJiqNmU5EQA7y/PTSmTqeHzXjWKXHrkeXP4+9+P836lJIf2vfDhg7QCkQLXNvJuUzIy5w/fnr70Z7dV1U84kR2GuW1yYMbCcy5sP/+++3syixd6mTS0UGDZ3zzldN9wq5TqpRC8D7oVbMXkqchYgsP+AIP28Vr5d28o+URCsLgjfP867JqpGgNQCCNCPwnfezQEBSBw1HYjaC9yV3mOSPidnyLI1N0E4JMhkJ2JIBkOAD5d9lufD7WeNR1Ll18P4Dfhub87NLUA4Ov7uvDtL9//k/rJoiHS+s1/8WRTlCkPTHEwFbS74FYEgA3HiUDErzm39exzTlNDd94n+u+9o3/Tw3+TvuhX+sD6PhkciMSiyeb2404cN+f9H8pHLrqsq88wRSEH+IMuhm9cYff89Hal1BoE2km6YupUAOW1lPQBvobQFNkfMA2ULfZCx9LllyJIePtq+CjJihAoloT+kkKYpFaKwNwU+gIWhlrLVIw6Tr8FoKNk/nQuW/LhjqXLG8P3/7zbef17ec1P57IlN3csXd4Wgsc3ykCkJNeWJbxhL6aPPbxt+XdqxKd9q+UrnxaYWE3KB5M+mGGClAIzTUArCOVjxKuNx+uvuyIx/trL5x6zuSe748GHmbfplRRPb3fzvZsH+ncMFXJpmzOtNMxIVXVtZFxLe7ORHH+UH5kxp6nj4vMHC+3Tt2UizO2zQb4Nbj/TJ3q/fa899PQjCKJnW8Nx8ypT+uBV6YocBikvBNzXa7u9b3UuWyL28l5qL47RUiHh1FAV/23JhCn/TsfS5RsRZMFW7eM4/xNqML/oXLbkA7u9PwfAxxFQeW4C8KvOZUu69nKuyfCzMxFEYh4F8Lt9XfsezPPqaKLxgljrR66j6kuPVzrGGVTQIcEwwMwouGGCWZFAczEMcMtCNB5DPKYRsQQM5msix4V2PU6ur3hVQivOGU/EfRnhdtFEMW9DexIkJZi7oUDp3z9l9/7uAenn1yFIwutBkE1c0UwqgFKRMrAQCMLC0/fxuTkAXsLfp/+/Vj6/OGfoSNQvuAypC85D8tSjmDkupYkzxnnQSpSH/Z9CoAE3wtYsCFqMMoSEJhxaK2gRNhBXAIjA5Agx95V+MXLPSjlyz1PCGVpLgfbWE2qNpd40FakASkXKwKI3NG/+FPpfng8XSwxAO4C3APhC+P+z9kV/cIRBxUSQuDfDio07xkgevcCqOW0hWfOmcKuuiowqTjABHg2Ag3GwoC3gzv8DDIwEGAjQRZDozzF/fb8qPL9FFVau83Nr1isltyGI4AyF5k2pfWpFKoBSkb1oHw/i76kOsAc/x83/YPO21GM7BaCJcTaZ88TEaPXUaQrN44xIU7MZbW3g0YYEmGUE7l0DYIyRdgXJrENyOCOc4bRBXUOisGGH8PL9IBqkgBw9jdEeTyWNpNJNoQIoFTkAYDkVwNUICg1rEHQaGMQeSJX+AaWksUQQNJhLAEgxoJoBMXBEMdrx0ACgQZBE8AEICrSOUieGUu+eUiOwUleFilQApSJvMuEY7QG1p3appUeJAEmVPe/eaeGI8au84QCFqHLfKlKRihw+VK9IRSpSkQqgVKQiFakASkUqUpEKoFSkIhWpSAVQKlKRilQApSIVqUgFUCpSkYpUAKUiFalIRSqAUpGKVKQCKBWpSEUqgFKRilSkIhVAqUhFKlIBlIpUpCKvI/n/OPpElQ8JAN8AAAAASUVORK5CYII=') !important; "+
"                        }"+

"#hplogo:not(img)        { content: inherit !important; } /* Keeps country name under logo */"+
"";

function to_rgba(c, a)
{
    var m = c.match(/#(..)(..)(..)/);
    if (!m)
    {
	m = c.match(/#(.)(.)(.)/);
	if (m)
	    m = m.map(function(c){ return c + c; });
    }
    if (!m)
	m = [0, '0', '0', '0'];
    m = m.map(function(c){ return parseInt('0x' + c) + ','; });
    return ('rgba(' + m[1] + m[2] + m[3] + a + ')');
}

function add_style(css)
{
    var head = document.querySelector('head');    
    var node = document.createElement('style');
    node.type = "text/css";
    node.innerHTML = css;
    head.appendChild(node);
    return node;
}
var addStyle = add_style;

var applied_style;
function set_night_mode_style()
{
    if (night_mode_on())
	applied_style = add_style(night_style);
    else
	if (applied_style)
	{
	    applied_style.parentNode.removeChild(applied_style);
	    applied_style = null;
	}
}

function night_mode_on()
{
    return get_bool_setting('images_night_mode', false);
}

function toggle_style()
{
    set_bool_setting('images_night_mode', !night_mode_on());
    set_night_mode_style();
}

function add_style_toggle_button()
{
//    var div = document.body.querySelector('#subform_ctrl');
    var div = document.body.querySelector('#resultStats');
    if (!div)
	return;
    var a = document.createElement('a');
    a.className = 'q';
    a.innerText = 'Night Mode';
    a.style = 'float:right; color:#888;';
    a.onclick = toggle_style;
    div.appendChild(a);
}

/****************************************** menu ********************************************/

var menu;
function create_menu(link)
{
    var parent = link.parentNode;
    parent.style = "position:relative;";    
    addStyle(menu_style);	     

    menu = document.buildElement('div', {}, menu_html);
    parent.appendChild(menu);

    var links = menu.getElementsByTagName('a');
    links[0].onclick = show_options;    // google classic options
    links[1].href = link.url;          // normal search preferences    
    links[2].href = advanced_search_url;
}

function hide_menu()
{
    menu.style = 'display:none;';
    window.removeEventListener('click', hide_menu, false);
}

function show_menu(e)
{
    if (!menu)
	create_menu(this);
    menu.style = 'display:auto;';
    window.addEventListener('click', hide_menu, false);    
    e.preventDefault();
}

var menu_style =
"@namespace url(http://www.w3.org/1999/xhtml); "+
".menu_dropdown { background: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.196); box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.196); font-size: 13px; padding: 0px 0px 6px; position: absolute; right: 0px; top: 28px; transition: opacity 0.22s cubic-bezier(0.25, 0.1, 0.25, 1) 0; white-space: nowrap; z-index: 3; } " +
".menu_dropdown a { text-decoration:none; display: block; padding: 8px 20px 8px 16px; } " +
".menu_dropdown a, .menu_dropdown a:visited, .menu_dropdown a:hover { color: #333333;} " +
".menu_dropdown a:hover {background-color:#eee; text-decoration:none;} ";

// TODO use current page language !
var menu_html =
'<div class="menu_dropdown">'+
'  <ul>'+
'    <li><a>Google Classic</a></li>'+
'    <li><a>Search Settings</a></li>'+
'    <li><a href="/advanced_search?q=foo&hl=en">Advanced Search</a></li>'+
'    <li><a href="/history/optout?hl=en">Web History</a></li>'+
'    <li><a href="http://support.google.com/images?hl=en">Search Help</a></li>'+
'  </ul>'+
'</div>';

function init_menu()
{
    var a = document.querySelector("#gbg5");
    if (!a)
	return;
    a.onclick = show_menu;
    a.url = a.href;
    a.href = "javascript:;";
}

/***************************************** extension messaging ********************************************/

var bgproc;
function extension_message(e)
{
    var m = e.data;
    if (!bgproc)
	bgproc = e.source;
}

function show_options()
{
    bgproc.postMessage("show_options");
}



/************************************************** init *************************************************/

function needed()
{
    return !get_bool_setting('images_disabled', false);
}

function on_document_ready(f)
{
    function check_ready()
    {
	if (document.body)
	    f();
	else
	    setTimeout(check_ready, 50);
    }
    setTimeout(check_ready, 50);
}

function doc_ready()
{
    if (!needed()) return;
    add_style(common_style);
    if (get_bool_setting("images_zoom_on_hover", false))
	add_style(zoom_on_hover_style);
    set_night_mode_style();
}

function main()
{
    if (!needed()) return;    
    var n = document.getElementById("rg_hr");

    checkVersion();
    init_bottom_links();    
    add_extra_sizes_link();
    init_menu();

    add_style_toggle_button();
    
    //if ((/&sout=1/).test(document.location.href)) {
    if (true) { // force old stuff, for now.
	oldLinks();
    } else if (n) {
	setTrig();
    } else if (n = evalNode('//input[@name="bih"]')) {
	if (basicVersion()) {
		var i = document.createElement('input');
		i.setAttribute('type', 'hidden');
		i.setAttribute('name', 'sout');
		i.setAttribute('value', '1')
		n.parentNode.appendChild(i);
	}
    } else {
	var link = document.getElementById('thumbnail');
	if (!link) {
		link = evalNode('//ul[@class="il_ul"]/li/a');
		if (!link) {
			return;
		}
		window.location.replace(link.href);
	}
    }
}

opera.extension.onmessage = extension_message;
on_document_ready(doc_ready);
document.addEventListener('DOMContentLoaded', main, false); 

})(window.document, window.location, window.setTimeout, widget.preferences);
