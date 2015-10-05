'use strict';
/**
 * Fix for the "weld" library useful for files with a lot of identical ids, classes etc. but different parents.
 * In these cases it takes the parent node into account too.
 */
var
	weld   = require('weld'),
	format = require('x-format');

module.exports = function F(el, data, config) {
	
	// copied from weld and modified to use a set of of found targets instead of only the first
	function traverse(parent, element, key, value) {
		if(!value) return;
		var target, i, keys, l, obj;
		var template = element;
		var templateParent = element.parentNode;
		var ops = this;
		
		// LEAF
		if (~({}).toString.call(value).indexOf('Date')){ // type check for javascript type Date
			value = value.toString();
		}
		
		if (value.nodeType || typeof value !== 'object'){
			if (!value.nodeType ) value = '' + value; // added to enforce string for use with domino
			
			ops.set(parent, element, key, value);
			
		} else if (value.length && value[0]){// ARRAY / NodeList
			if (templateParent){
				ops.siblings(templateParent, template, key, value);
			} else if (template.weld && template.weld.parent){
				templateParent = template.weld.parent;
			}
			
			l = value.length;
			for (i = 0; i < l; i++) {
				target = element.cloneNode(true);
				target.weld = {};
				
				// Clone weld params
				if (element.weld){
					var keys = Object.keys(element.weld), currentKey = keys.length, weldParam;
					while (currentKey--) {
						weldParam = keys[currentKey];
						target.weld[weldParam] = element.weld[weldParam];
					}
				}
				
				ops.traverse(templateParent, target, i, value[i]);
				ops.insert(templateParent, target, i, value[i]);
			}
		} else { // OBJECT
			var keys = Object.keys(value), current = keys.length, obj;
			while (current--) {
				var lkey = keys[current];
				obj = value[lkey];
				target = ops.match(template, element, lkey, obj);
				
				if (target){
					/* NEW BEGIN */
					if (target.length||target.length===0){ /* NEW  allow match to be a an array or NodeList (with 0 length)*/
						for (var i = 0, l = target.length; i < l; i++) {
							ops.traverse(template, target[i], lkey, obj);
						}
					} else {
						ops.traverse(template, target, lkey, obj);
					}
					
					// Handle the case where a parent data key doesn't
					// match a dom node, but the child data object may.
					// don't continue traversing if the child data object
					// is not an array/object
				} else if (target !== false &&
					typeof obj === 'object' &&
					Object.keys(obj).length > 0){ // TODO: optimize
					//ops.set(templateParent, template, lkey, obj);
					ops.traverse(templateParent, template, lkey, obj);
				}
			}
		}
	}
	
	// copied from wel.sh and modified to return a set
	function match(parent, element, key, value) {
		if (config.alias && typeof config.alias[key] !== 'undefined'){
			if (typeof config.alias[key] === 'function'){
				key = config.alias[key](parent, element, key, value) || key;
			}
			else if (config.alias[key] === false){
				return false;
			}
			else {
				key = config.alias[key];
			}
		}
		
		// Alias can be a node, for explicit binding.
		// // Alias can also be a method that returns a string or DOMElement
		if (key && key.nodeType){
			return key;
		}
		if (element && key){
			var found_els = [];
			if (element.getElementsByTagName){
				var els = element.getElementsByTagName('*'), l = els.length, e, i;
				// find the _first_ best match
				for (i = 0; i < l; i++) {
					e = els[i];
					// to make it case insensitive
					var key_test = key.toLowerCase();
					
					if( (e.id   && e.id.toLowerCase() === key_test )
					 || (e.name && e.name.toLowerCase() === key_test )
					 || (e.className.toLowerCase().split(' ').indexOf(key_test) > -1 )
					  ){
						found_els.push(e);
					}
				}
			}
			return found_els;
		}
	}
	
	var map = function map(parent, el, k, v) {
		if(!v) return false;
		
		if (v.nodeType || typeof v !== 'object'){ // primitive type
			if (el && v && 'url' === k ){
					var an/*attribute name*/ = el.href ? 'href' : (el.action ? 'action' : (el.src ? 'src' : null));
					if (an)el[an] = v;
					return false;
			}
			if (el && v && k) {
				if (~k.toLowerCase().indexOf('date')){
					el.innerHTML = format.date(v);
					return false;
				}
			}
		} else
			return false;
	};
	
	// if map exits prepend the map defined here then call the defined one
	if (config.map) config.map = (function (orig_map) {
		return function () {
			if (false !== map.apply(this, arguments)) return orig_map.apply(this, arguments);
			else return false;
		};
	})(config.map);
	else config.map = map;
	
	config.traverse = config.traverse || traverse;
	config.match = config.match || match;
	
	weld.weld(el, data, config);
};
