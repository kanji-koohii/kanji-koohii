/*! AutoComplete based on work by 'zichun' (http://codeproject.com/jscript/jsactb.asp) */
/**
 * Changes:
 * - use stylesheet instead of setting the style property by code
 * - use <iframe> to display the dropdown on top of other elements (such as combobox) in Internet Explorer 5.5+
 * - misc small fixes to the behaviour
 * - removed unused variables
 * - firstText behaviour also matches words beginning after spaces in text
 * - ! removed support for 'delimiters'
 * v2.1
 * - uses polling for compatibility with IME (Input Method Editor)
 */

var AUTOSUGGEST_CONTAINER_ID = 'actbdiv';
var USE_IFRAME_FIX = false; // only really needed for IE, but compatible with other browsers

function ac_addEvent(obj, event_name, func_name)
{
  if (obj.attachEvent) 
  {
    obj.attachEvent("on" + event_name, func_name);
  } else if (obj.addEventListener) 
  {
    obj.addEventListener(event_name, func_name, true);
  } else 
  {
    obj["on" + event_name] = func_name;
  }
}

function ac_removeEvent(obj, event_name, func_name)
{
  if (obj.detachEvent) 
  {
    obj.detachEvent("on" + event_name, func_name);
  } else if (obj.removeEventListener) 
  {
    obj.removeEventListener(event_name, func_name, true);
  } else 
  {
    obj["on" + event_name] = null;
  }
}

function stopEvent(evt)
{
  evt = evt || window.event;
  if (evt.stopPropagation) 
  {
    evt.stopPropagation();
    evt.preventDefault();
  } else if (typeof evt.cancelBubble != "undefined") 
  {
    evt.cancelBubble = true;
    evt.returnValue = false;
  }
  return false;
}

function getCaretEnd(obj)
{
  if (typeof obj.selectionEnd != "undefined") 
  {
    return obj.selectionEnd;
  } else if (document.selection && document.selection.createRange) 
  {
    var M = document.selection.createRange();
    try 
    {
      var Lp = M.duplicate();
      Lp.moveToElementText(obj);
    } 
    catch (e) 
    {
      var Lp = obj.createTextRange();
    }
    Lp.setEndPoint("EndToEnd", M);
    var rb = Lp.text.length;
    if (rb > obj.value.length) 
    {
      return -1;
    }
    return rb;
  }
}

function getCaretStart(obj)
{
  if (typeof obj.selectionStart != "undefined") 
  {
    return obj.selectionStart;
  } else if (document.selection && document.selection.createRange) 
  {
    var M = document.selection.createRange();
    try 
    {
      var Lp = M.duplicate();
      Lp.moveToElementText(obj);
    } 
    catch (e) 
    {
      var Lp = obj.createTextRange();
    }
    Lp.setEndPoint("EndToStart", M);
    var rb = Lp.text.length;
    if (rb > obj.value.length) 
    {
      return -1;
    }
    return rb;
  }
}

function setCaret(obj, l)
{
  obj.focus();
  if (obj.setSelectionRange) 
  {
    obj.setSelectionRange(l, l);
  } else if (obj.createTextRange) 
  {
    var m = obj.createTextRange();
    m.moveStart('character', l);
    m.collapse();
    m.select();
  }
}

function setSelection(obj, s, e)
{
  obj.focus();
  if (obj.setSelectionRange) 
  {
    obj.setSelectionRange(s, e);
  } else if (obj.createTextRange) 
  {
    var m = obj.createTextRange();
    m.moveStart('character', s);
    m.moveEnd('character', e);
    m.select();
  }
}

String.prototype.addslashes = function()
{
  return this.replace(/(["\\\.\|\[\]\^\*\+\?\$\(\)])/g, '\\$1');
};
String.prototype.trim = function()
{
  return this.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
};
function curTop(obj)
{
  var toreturn = 0;
  while (obj) 
  {
    toreturn += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return toreturn;
}

function curLeft(obj)
{
  var toreturn = 0;
  while (obj) 
  {
    toreturn += obj.offsetLeft;
    obj = obj.offsetParent;
  }
  return toreturn;
}

function isNumber(a)
{
  return typeof a == 'number' && isFinite(a);
}

function replaceHTML(obj, text)
{
  let el;
  while (el = obj.childNodes[0])
  {
    obj.removeChild(el);
  }
  obj.appendChild(document.createTextNode(text));
}

const actb = function(obj, ca)
{
  /* ---- Public Variables ---- */
  this.actb_timeOut = -1; // Autocomplete Timeout in ms (-1: autocomplete never time out)
  this.actb_lim = 8; // Number of elements autocomplete can show (-1: no limit)
  this.actb_firstText = true; // should the auto complete be limited to the beginning of keyword?
  this.actb_midTextSeparator = "[\\s-\/]"; // regexp to match start of search (if firsttext=true)
  this.actb_mouse = true; // Enable Mouse Support
  this.actb_startcheck = 1; // Show widget only after this number of characters is typed in.
  this.actb_delimiter = []; // Delimiter for multiple autocomplete. Set it to empty array for single autocomplete
  this.onChangeCallback = null;
  this.onPressEnterCallback = null;

  // formats extra information into each row of the dropdown, given row number
  /** @type {(row: number) => string} */
  this.actb_extracolumns = function (iRow) { return ''; };

  /* ---- Private Variables ---- */
  var actb_delimwords = [];
  var actb_cdelimword = 0;
  var actb_delimchar = [];
  var actb_display = false;
  var actb_pos = 0;
  var actb_total = 0;
  var actb_elem = null;
  var actb_rangeu = 0;
  var actb_ranged = 0;
  var actb_bool = [];
  var actb_pre = 0;
  var actb_toid;
  var actb_tomake = false;
  var actb_mouse_on_list = 1;
  var actb_caretmove = false;
  var actb_curvalue = '';
  
  var poll_txt = null, poll_tid = null, poll_msec = 300; // IME
  /* ---- Private Variables---- */
  
  this.actb_keywords = ca;
  var actb_self = this;
  
  actb_elem = obj;
  
  actb_curvalue = actb_elem.value;
  
  // turn off browser's autocomplete feature
  actb_elem.setAttribute("autocomplete", "off");
  
  ac_addEvent(actb_elem, "focus", actb_setup);
  
  function actb_setup()
  {
    ac_addEvent(document, "keydown", actb_checkkey);
    ac_addEvent(actb_elem, "blur", actb_clear);
    ac_addEvent(document, "keypress", actb_keypress);
  }
  function actb_clear()
  {
    ac_removeEvent(document, "keydown", actb_checkkey);
    ac_removeEvent(actb_elem, "blur", actb_clear);
    ac_removeEvent(document, "keypress", actb_keypress);
    actb_removedisp();
    
    poll_clear();
    
    if (actb_elem.value != actb_curvalue) 
    {
      actb_curvalue = actb_elem.value;
      if (this.onChangeCallback != null) 
      {
        actb_self.onChangeCallback(actb_curvalue);
      }
    }
  }
  function actb_parse(n)
  {
    if (actb_self.actb_delimiter.length > 0) 
    {
      var t = actb_delimwords[actb_cdelimword].trim().addslashes();
      var plen = actb_delimwords[actb_cdelimword].trim().length;
    } else 
    {
      var t = actb_elem.value.addslashes();
      var plen = actb_elem.value.length;
    }
    var i;
    
    if (actb_self.actb_firstText) 
    {
      var re = new RegExp("^" + t + "|" + actb_self.actb_midTextSeparator + t, "i");
    } else 
    {
      var re = new RegExp(t, "i");
    }
    var p = n.search(re);
    
    //++ (do not highlight the keyword separator itself)
    if (actb_self.actb_firstText && p >= 0 && n.substr(p, 1).search(actb_self.actb_midTextSeparator) >= 0) 
      p++;
    
    var tobuild = n.substr(i, p) + "<span class='h'>" + n.substr(p, plen) + "</span>" + n.substr(plen + p);
    
    return tobuild;
  }
  
  
  //++ create container DIV for the table and (optional) iframe fix, returns the div element reference
  function actb_makecontainer(left, top, width)
  {
    var containerdiv = document.createElement('div');
    containerdiv.style.position = 'absolute';
    //    containerdiv.style.width = actb_elem.offsetWidth + 'px';
    containerdiv.style.top = top + 'px';
    containerdiv.style.left = left + 'px';
    containerdiv.style.width = width + 'px';
    containerdiv.id = AUTOSUGGEST_CONTAINER_ID;
    return containerdiv;
  }
  //++ create an iframe to be placed right behind the table (fixes combobox overlap in Internet Explorer)
  function actb_makeiframe()
  {
    var iframe = document.createElement('iframe');
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.style.position = 'absolute';
    return iframe;
  }
  //++
  function actb_parent()
  {
    return document.getElementsByTagName('body')[0];
  }
  function actb_generate()
  {
    if (document.getElementById(AUTOSUGGEST_CONTAINER_ID)) 
    {
      actb_display = false;
      actb_parent().removeChild(document.getElementById(AUTOSUGGEST_CONTAINER_ID));
    }
    
    if (actb_total == 0) 
    {
      actb_display = false;
      return;
    }
    var a = document.createElement('table');
    a.cellSpacing = '0';
    a.style.position = 'absolute';
    a.id = 'actb-' + actb_elem.id; // build id from textbox id, for styling
    var posTop = eval(curTop(actb_elem) + actb_elem.offsetHeight) + 2;
    var posLeft = curLeft(actb_elem);

    var width = Math.max(actb_elem.offsetWidth, 172);
    
    var cdiv = actb_makecontainer(posLeft, posTop, width);

    cdiv.appendChild(a);
    actb_parent().appendChild(cdiv);
    
    //++ In IE we add an IFRAME right under the table, to fix the combobox overlap
    if (window.USE_IFRAME_FIX) 
    {
      window.setTimeout(function()
      {
        // at this point, we should be able to read the proper pixel dimensions of the table (tested: ie/firefox)
        var tWidth = a.offsetWidth;
        var tHeight = a.offsetHeight;
        var iframe = actb_makeiframe();
        iframe.style.width = actb_elem.offsetWidth + 'px';
        iframe.style.height = tHeight + 'px';
        cdiv.insertBefore(iframe, a);
      }, 0);
    }
    
    var i, length;
    var first = true;
    var j = 1;
    if (actb_self.actb_mouse) 
    {
      a.onmouseout = actb_table_unfocus;
      a.onmouseover = actb_table_focus;
    }
    var counter = 0;
    for (i = 0, length = actb_self.actb_keywords.length; i < length; i++) 
    {
      if (actb_bool[i]) 
      {
        counter++;
        let r = a.insertRow(-1);
        if (first && !actb_tomake) 
        {
          r.className = 'highlight';
          first = false;
          actb_pos = counter;
        } else if (actb_pre == i) 
        {
          r.className = 'highlight';
          first = false;
          actb_pos = counter;
        } else 
        {
          r.className = 'inactive';
        }
        r.id = 'tat_tr' + (j);
        let c = r.insertCell(-1);
        c.innerHTML = actb_self.actb_extracolumns(i) + actb_parse(actb_self.actb_keywords[i]);
        c.id = 'tat_td' + (j);
        c.setAttribute('pos', j);
        if (actb_self.actb_mouse) 
        {
          c.onclick = actb_mouseclick;
          c.onmouseover = actb_table_highlight;
        }
        j++;
      }
      
      if (j - 1 == actb_self.actb_lim && j < actb_total) 
      {
        let r = a.insertRow(-1);
        r.className = 'inactive';
        let c = r.insertCell(-1);
        c.className = 'more';
        replaceHTML(c, '...');
        if (actb_self.actb_mouse) 
        {
          c.onclick = actb_mouse_down;
        }
        break;
      }
      
    }
    actb_rangeu = 1;
    actb_ranged = j - 1;
    actb_display = true;
    if (actb_pos <= 0) 
      actb_pos = 1;
  }
  function actb_remake()
  {
    cdiv = document.getElementById(AUTOSUGGEST_CONTAINER_ID);//++
    cdiv.removeChild(document.getElementById(AUTOSUGGEST_TABLE_ID));
    
    var a = document.createElement('table');
    a.cellSpacing = '0';
    a.style.position = 'absolute';
    //    a.style.width = '100%'; //actb_elem.offsetWidth + 'px';
    a.id = AUTOSUGGEST_TABLE_ID;
    if (actb_self.actb_mouse) 
    {
      a.onmouseout = actb_table_unfocus;
      a.onmouseover = actb_table_focus;
    }
    var cdiv = document.getElementById(AUTOSUGGEST_CONTAINER_ID);
    cdiv.appendChild(a);
    
    //++ Resize the iframe (see actb_generate)
    if (window.USE_IFRAME_FIX) 
    {
      window.setTimeout(function()
      {
        var tHeight = a.offsetHeight;
        var iframe = cdiv.getElementsByTagName('iframe');
        if (iframe[0]) /* the iframe should be created only in IE */ 
        {
          iframe[0].style.height = tHeight + 'px';
        }
      }, 0);
    }
    
    
    var i, length;
    var first = true;
    var j = 1;
    if (actb_rangeu > 1) 
    {
      let r = a.insertRow(-1);
      r.className = 'inactive';
      let c = r.insertCell(-1);
      c.className = 'more';
      replaceHTML(c, '...');
      if (actb_self.actb_mouse) 
      {
        c.onclick = actb_mouse_up;
      }
    }
    for (i = 0, length = actb_self.actb_keywords.length; i < length; i++) 
    {
      if (actb_bool[i]) 
      {
        if (j >= actb_rangeu && j <= actb_ranged) 
        {
          let r = a.insertRow(-1);
          r.className = 'inactive';
          r.id = 'tat_tr' + (j);
          let c = r.insertCell(-1);
          c.innerHTML = actb_self.actb_extracolumns(i) + actb_parse(actb_self.actb_keywords[i]);
          c.id = 'tat_td' + (j);
          c.setAttribute('pos', j);
          if (actb_self.actb_mouse) 
          {
            c.onclick = actb_mouseclick;
            c.onmouseover = actb_table_highlight;
          }
          j++;
        } else 
        {
          j++;
        }
      }
      if (j > actb_ranged) 
        break;
    }
    if (j - 1 < actb_total) 
    {
      let r = a.insertRow(-1);
      r.className = 'inactive';
      let c = r.insertCell(-1);
      c.className = 'more';
      replaceHTML(c, '...');
      if (actb_self.actb_mouse) 
      {
        c.onclick = actb_mouse_down;
      }
    }
  }
  function actb_goup()
  {
    if (!actb_display) 
      return;
    if (actb_pos == 1) 
      return;
    document.getElementById('tat_tr' + actb_pos).className = 'inactive';
    actb_pos--;
    if (actb_pos < actb_rangeu) 
      actb_moveup();
    document.getElementById('tat_tr' + actb_pos).className = 'highlight';
    if (actb_toid) 
      clearTimeout(actb_toid);
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  function actb_godown()
  {
    if (!actb_display) 
      return;
    if (actb_pos == actb_total) 
      return;
    document.getElementById('tat_tr' + actb_pos).className = 'inactive';
    actb_pos++;
    if (actb_pos > actb_ranged) 
      actb_movedown();
    document.getElementById('tat_tr' + actb_pos).className = 'highlight';
    if (actb_toid) 
      clearTimeout(actb_toid);
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  function actb_movedown()
  {
    actb_rangeu++;
    actb_ranged++;
    actb_remake();
  }
  
  function actb_moveup()
  {
    actb_rangeu--;
    actb_ranged--;
    actb_remake();
  }
  
  /* Mouse */
  function actb_mouse_down()
  {
    document.getElementById('tat_tr' + actb_pos).className = 'inactive';
    actb_pos++;
    actb_movedown();
    document.getElementById('tat_tr' + actb_pos).className = 'highlight';
    actb_elem.focus();
    actb_mouse_on_list = 0;
    if (actb_toid) 
    {
      clearTimeout(actb_toid);
    }
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  function actb_mouse_up(evt)
  {
    if (!evt) 
      evt = event;
    if (evt.stopPropagation) 
    {
      evt.stopPropagation();
    } else 
    {
      evt.cancelBubble = true;
    }
    document.getElementById('tat_tr' + actb_pos).className = 'inactive';
    actb_pos--;
    actb_moveup();
    document.getElementById('tat_tr' + actb_pos).className = 'highlight';
    actb_elem.focus();
    actb_mouse_on_list = 0;
    if (actb_toid) 
      clearTimeout(actb_toid);
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  function actb_mouseclick(evt)
  {
    if (!evt) 
      evt = event;
    if (!actb_display) 
      return;
    actb_mouse_on_list = 0;
    actb_pos = this.getAttribute('pos');
    actb_penter();
  }
  function actb_table_focus()
  {
    actb_mouse_on_list = 1;
  }
  function actb_table_unfocus()
  {
    actb_mouse_on_list = 0;
    if (actb_toid) 
      clearTimeout(actb_toid);
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  function actb_table_highlight()
  {
    actb_mouse_on_list = 1;
    document.getElementById('tat_tr' + actb_pos).className = 'inactive';
    actb_pos = this.getAttribute('pos');
    while (actb_pos < actb_rangeu) 
      actb_moveup();
    while (actb_pos > actb_ranged) 
      actb_movedown();
    document.getElementById('tat_tr' + actb_pos).className = 'highlight';
    if (actb_toid) 
      clearTimeout(actb_toid);
    if (actb_self.actb_timeOut > 0) 
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
  }
  /* ---- */
  
  function actb_insertword(a)
  {
    if (actb_self.actb_delimiter.length > 0) 
    {
      var str = '';
      var l = 0;
      for (i = 0; i < actb_delimwords.length; i++) 
      {
        if (actb_cdelimword == i) 
        {
          prespace = postspace = '';
          gotbreak = false;
          for (j = 0; j < actb_delimwords[i].length; ++j) 
          {
            if (actb_delimwords[i].charAt(j) != ' ') 
            {
              gotbreak = true;
              break;
            }
            prespace += ' ';
          }
          for (j = actb_delimwords[i].length - 1; j >= 0; --j) 
          {
            if (actb_delimwords[i].charAt(j) != ' ') 
              break;
            postspace += ' ';
          }
          str += prespace;
          str += a;
          l = str.length;
          if (gotbreak) 
            str += postspace;
        } else 
        {
          str += actb_delimwords[i];
        }
        if (i != actb_delimwords.length - 1) 
        {
          str += actb_delimchar[i];
        }
      }
      actb_elem.value = str;
      setCaret(actb_elem, l);
    } else 
    {
      actb_elem.value = a;
    }
    actb_mouse_on_list = 0;
    actb_removedisp();
    
    //++ callback for updating other stuff on the page based on selected entry
    //if (actb_self.onchangeEvent != null)
    //  actb_self.onchangeEvent();
  }
  function actb_penter()
  {
    actb_display = false;
    var word = '';
    var c = 0;
    for (var i = 0, length = actb_self.actb_keywords.length; i <= length; i++) 
    {
      if (actb_bool[i]) 
        c++;
      if (c == actb_pos) 
      {
        word = actb_self.actb_keywords[i];
        break;
      }
    }
    actb_insertword(word);
    // l = getCaretStart(actb_elem);
    
    if (actb_self.onChangeCallback) 
    {
      actb_self.onChangeCallback(actb_elem.value);
    }
  }
  function actb_removedisp()
  {
    if (actb_mouse_on_list == 0) 
    {
      actb_display = 0;
      if (document.getElementById(AUTOSUGGEST_CONTAINER_ID)) 
      {
        actb_parent().removeChild(document.getElementById(AUTOSUGGEST_CONTAINER_ID));
      }
      if (actb_toid) 
        clearTimeout(actb_toid);
    }
  }
  function actb_keypress(e)
  {
    if (actb_caretmove) 
      stopEvent(e);
    return !actb_caretmove;
  }
  function actb_checkkey(evt)
  {
    if (!evt) 
      evt = event;
    var a = evt.keyCode;
    
    // caret_pos_start = getCaretStart(actb_elem);
    actb_caretmove = 0;
    switch (a) {
      case 38://uparrow
        actb_goup();
        actb_caretmove = 1;
        return false;
        break;
      case 40://downarrow
        actb_godown();
        actb_caretmove = 1;
        return false;
        break;
      case 13:
      case 9://enter, tab
        if (actb_display) {
          actb_caretmove = 1;
          actb_penter();
          return false;
        } else {
          if (actb_self.onPressEnterCallback) 
          {
            actb_self.onPressEnterCallback(actb_elem.value);
            return false;
          }
          return true;
        }
        break;
      //++
      case 16:
      case 17:
      case 18: // shift, control, alt
        return false;
        break;
      default:
        // old way
        //setTimeout(function(){actb_tocomplete(a)},50);
        // (re-)start polling textbox changes (compatible with IME)
        if (poll_txt === null) 
        {
          poll_txt = actb_elem.value;
        }
        if (poll_tid !== null) 
        {
          window.clearTimeout(poll_tid);
        }
        poll_tid = window.setTimeout(function()
        {
          poll_event(a)
        }, poll_msec);
        
        break;
    }
  }
  
  // IME-compatible polling of textbox content
  function poll_event(kc)
  {
    var cur_txt = actb_elem.value;
    if (cur_txt !== poll_txt) 
    {
      poll_txt = cur_txt;
      actb_tocomplete(kc);
    }
    poll_tid = window.setTimeout(poll_event, poll_msec);
  }
  function poll_clear()
  {
    if (poll_tid !== null) 
    {
      window.clearTimeout(poll_tid);
      poll_tid = null;
    }
    poll_txt = null;
  }
  
  function actb_tocomplete(kc)
  {
    var i, length;
    
    if (kc == 38 || kc == 40 || kc == 13 || kc == 9) 
    {
      return;
    }
    
    if (actb_display) 
    {
      var word = 0;
      var c = 0;
      for (var i = 0, length = actb_self.actb_keywords.length; i <= length; i++) 
      {
        if (actb_bool[i]) 
          c++;
        if (c == actb_pos) 
        {
          word = i;
          break;
        }
      }
      actb_pre = word;
    } else 
    {
      actb_pre = -1;
    }
    
    if (actb_elem.value == '') 
    {
      actb_mouse_on_list = 0;
      actb_removedisp();
      return;
    }
    
    if (actb_self.actb_delimiter.length > 0) 
    {
      // caret_pos_start = getCaretStart(actb_elem);
      var caret_pos_end = getCaretEnd(actb_elem);
      
      let delim_split = '';
      for (i = 0; i < actb_self.actb_delimiter.length; i++) 
      {
        delim_split += actb_self.actb_delimiter[i];
      }
      delim_split = delim_split.addslashes();
      delim_split_rx = new RegExp("([" + delim_split + "])");
      let c = 0;
      actb_delimwords = [];
      actb_delimwords[0] = '';
      for (i = 0, j = actb_elem.value.length; i < actb_elem.value.length; i++, j--) 
      {
        if (actb_elem.value.substr(i, j).search(delim_split_rx) === 0) 
        {
          ma = actb_elem.value.substr(i, j).match(delim_split_rx);
          actb_delimchar[c] = ma[1];
          c++;
          actb_delimwords[c] = '';
        } else 
        {
          actb_delimwords[c] += actb_elem.value.charAt(i);
        }
      }
      
      var l = 0;
      actb_cdelimword = -1;
      for (i = 0; i < actb_delimwords.length; i++) 
      {
        if (caret_pos_end >= l && caret_pos_end <= l + actb_delimwords[i].length) 
        {
          actb_cdelimword = i;
        }
        l += actb_delimwords[i].length + 1;
      }
      var ot = actb_delimwords[actb_cdelimword].trim();
      var t = actb_delimwords[actb_cdelimword].addslashes().trim();
    } else 
    {
      var ot = actb_elem.value;
      var t = actb_elem.value.addslashes();
    }
    
    if (ot.length == 0) 
    {
      actb_mouse_on_list = 0;
      actb_removedisp();
    }
    if (ot.length < actb_self.actb_startcheck) 
      return this;
    
    if (actb_self.actb_firstText) 
    {
      var re = new RegExp("^" + t + "|" + actb_self.actb_midTextSeparator + t, "i");
    } else 
    {
      var re = new RegExp(t, "i");
    }
    
    actb_total = 0;
    actb_tomake = false;
    for (i = 0, length = actb_self.actb_keywords.length; i < length; i++) 
    {
      actb_bool[i] = false;
      if (re.test(actb_self.actb_keywords[i])) 
      {
        actb_total++;
        actb_bool[i] = true;
        
        //++ (pick shortest if possible)  
        if (actb_self.actb_keywords[i] == ot) 
        {
          actb_pre = i;
        }
        
        if (actb_pre == i) 
        {
          actb_tomake = true;
        }
      }
    }
    
    if (actb_toid) 
    {
      clearTimeout(actb_toid);
    }
    
    if (actb_self.actb_timeOut > 0) 
    {
      actb_toid = setTimeout(function()
      {
        actb_mouse_on_list = 0;
        actb_removedisp();
      }, actb_self.actb_timeOut);
    }
    
    actb_generate();
  }
  return this;
}

export default actb;