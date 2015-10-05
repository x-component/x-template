'use strict';

var
	vows      = require('vows'),
	util      = require('util'),
	assert    = require('assert'),
	template  = require('../template2'),
	dom       = require('x-dom'),
	extend    = require('x-common').extend;

function _str( dom ){
	var s=dom.innerHTML;
	return s;
}

function _template_topic( data ){
	return {
		topic: function ( dom_str ) {
			var
				self = this,
				opts = {}; //{data2dom:[operation2dom,link2dom]};
			
			dom.parse(dom_str,function(err,win){
				if( typeof data === 'string' ){
					dom.parse(data,function(err,win_data){
						template(win.document,win_data.document,opts,function(err,el){
							self.callback(el,data);
						});
					});
				} else {
					template(win.document,data,opts,function(err,el){
						self.callback(el,data);
					});
				}
			});
		}
	};
}

function _match(data,regexp){
	var o= _template_topic(data);
	o['should match '+ regexp ]=function(el,data){
		var _;assert(regexp.test(_=_str(el)),'"'+_+'" with '+JSON.stringify(data)+' should match '+regexp);
	};
	return o;
}

function _not_match(data,regexp){
	var o= _template_topic(data);
	o['should *not* match '+ regexp ]=function(el,data){
		var _;assert(!regexp.test(_=_str(el)),'"'+_+'" with '+JSON.stringify(data)+' should *not* match '+regexp);
	};
	return o;
}


var suite = vows.describe('template2');
suite.addBatch({
	'simple':{
		topic: '<html><head></head><body></body></html>',
		'empty data': extend(_template_topic({}),{
			'equal': function(el,data){
				assert.deepEqual(_str(el),'<html><head></head><body></body></html>');
			}
		})
	},
	'simple test data-if':{
		topic: '<html><body><div data-if=".foo">TEST</div></body></html>',
		'foo there -> TEST'                 : _match    ({foo:{name:'x'}},/TEST/g),
		'foo not there -> no TEST'          : _not_match({bar:{}},/TEST/g),
		'foo not there -> no div'           : _not_match({bar:{}},/div/ig),
		'foo there but false -> no TEST'    : _not_match({foo:false},/TEST/g),
		'foo there but null -> no TEST'     : _not_match({foo:null},/TEST/g)
	},
	'simple number is 0 test data-is':{
		topic: '<html><body><div data-is=".foo">TEST</div></body></html>',
		'foo there -> 10'       : _match    ({foo:10},/10/g),
		'foo there -> -10'      : _match    ({foo:-10},/-10/g),
		'foo there -> 10.5'     : _match    ({foo:10.5},/10.5/g),
		'foo there -> 0'        : _match    ({foo:0},/0/g)
	},
	'simple test data-not':{
		topic: '<html><body><div data-not=".foo">TEST</div></body></html>',
		'foo not there -> TEST': _match    ({bar:{}},/TEST/g),
		'foo there -> no TEST' : _not_match({foo:{}},/TEST/g),
		'foo there -> no div'  : _not_match({foo:{}},/div/ig)
	},
	'simple text test data-is':{
		topic: '<html><body><div data-is=".foo">TEST</div></body></html>',
		'foo there -> bar'        : _match    ({foo:'bar'},/bar/g),
		'foo not there -> no TEST': _not_match({bar:{}}   ,/TEST/g),
		'foo not there -> no div' : _not_match({bar:{}}   ,/div/ig)
	},
	'simple date conversion in  data-is default locale en':{
		topic: '<html><body><div data-is=".theDate">TEST</div></body></html>',
		'number to date' : _match ({theDate:1340802266807},/06\/27\/2012/g),
		'date to date'   : _match ({theDate:'2012.06.27' },/06\/27\/2012/g)
	},
	'simple date conversion in  data-is using lang de':{
		topic: '<html lang="en"><body lang="de"><div data-is=".theDate">TEST</div></body></html>',
		'number to date' : _match ({theDate:1340802266807},/27.06.2012/g),
		'date to date'   : _match ({theDate:'2012.06.27'},/27.06.2012/g)
	},
	'simple a href url setting in  data-is':{
		topic: '<html><body><a data-is=".url" href="#" >TEST</a></body></html>',
		'url key to href' : _match({url:'/test'},/href="\/test"/g)
	},
	'simple text setting in textarea using  data-is':{
		topic: '<html><body><textarea data-is=".text">TEST</textarea></body></html>',
		'text key to inner html' : _match({text:'mytext'},/>\s*mytext</g)
	},
	'simple img src url setting in  data-is':{
		topic: '<html><body><img data-is=".url" src="#" ></img></body></html>',
		'url key to src' : _match({url:'/test'},/src="\/test"/g)
	},
	'simple input value setting in  data-is':{
		topic: '<html><body><input data-is=".foo" ></input></body></html>',
		'value to value not text' : _match({foo:'bar'},/value="bar"/g)
	},
	'simple input with type text value setting in  data-is':{
		topic: '<html><body><input type="text" data-is=".foo" ></input></body></html>',
		'value to value not text' : _match({foo:'bar'},/value="bar"/g)
	},
	'simple test data-if and ':{
		topic: '<html><body><div data-if=".foo and .bar">TEST</div></body></html>',
		'foo and bar there -> TEST'        : _match    ({foo:{},bar:{}},/TEST/g),
		
		'foo not there -> no TEST'         : _not_match({bar:{}},/TEST/g),
		'bar not there -> no TEST'         : _not_match({foo:{}},/TEST/g),
		'foo and bar not there -> no TEST' : _not_match({},/TEST/g),
		
		'foo not there -> no div'          : _not_match({bar:{}},/div/ig),
		'bar not there -> no div'          : _not_match({foo:{}},/div/ig),
		'foo and bar not there -> no div'  : _not_match({},/div/ig)
	},
	'complex test of recursive keys (foo must exist 3 times)':{
		topic: '<html><body><div data-is=".foo">TEST</div></body></html>',
		'value to value not text' : _match({foo:[{foo:'bar'},{blub:'baz2'}]},/TEST/g)
	},
	'nested data-is on object array' :{
		topic: '<html><body><div data-is=".result" >RESULT:<span data-is=".name">TEST</span></div></body></html>',
		'with 2 independent results' : _match({obj:{result:{name:'NAME1'}},obj2:{result:{name:'NAME2'}}},/NAME1<\/span><\/div>.*NAME2<\/span><\/div>/g),
		'with 2 result array' : _match({result:[{name:'NAME1'},{name:'NAME2'}]},/NAME1<\/span><\/div>.*NAME2<\/span><\/div>/g)
	},
	'nested data-is on empty array' :{
		topic: '<html><body><div data-is=".result" >RESULT:<span data-is=".name">TEST</span></div></body></html>',
		'with empty array' : _not_match({result:[]},/RESULT/g)
	},
	'dom as data':{
		topic:'<html><body><h1 data-is="h1">H1</h1><section data-is="section">SECTION<p data-is="p">P</p></section></body></html>',
		'h1': _match('<html><body><h1>DATA-H1</h1></body></html>',/DATA\-H1/g),
		'section with 2 paragraphs': _match('<html><body><section>DATA-SECTION<p>DATA-X1</p><p>DATA-X2</p></section></body></html>',/DATA\-SECTION([^X]+)X1([^X]+)X2/g)
	},
	'handle text as spans':{
		topic:'<html><body>' +
				'<p data-option="texts" data-is="p" data-exclude-texts="true" >' +
					'<span data-option="invisible" data-is="> span, > strong" data-exclude-texts="true" data-template="content" >'+
						'<span data-option="self invisible" data-is="> span.text"></span>'+
						'<strong data-option="self" data-is="> strong" data-exclude-texts="true" data-apply=":root [data-template=\'content\']"></strong>'+
					'</span>'+
				'</p>'+
			'</body></html>',
		'texts':_match('<html><p>1<strong>2</strong>3<strong>4</strong>5</p>',/>1<strong>2<\/strong>3<strong>4<\/strong>5</g)
	},
	'keep data-* from template and data-* from separate':{
		topic:'<html><body>' +
				'<p data-option="texts" data-is="p" data-exclude-texts="true" >' +
					'<span data-option="invisible" data-is="> span, > strong" data-exclude-texts="true" data-template="content" >'+
						'<span data-option="self invisible" data-is="> span.text"></span>'+
						'<strong data-option="self" data-is="> strong" data-exclude-texts="true" data-apply=":root [data-template=\'content\']"></strong>'+
					'</span>'+
				'</p>'+
			'</body></html>',
		'texts':_match('<html><p data-if=".foo">1<strong data-is=".bar">2</strong>3<strong>4</strong>5</p>',/data\-if="\.foo".*data\-is=".bar"/g)
	}
}).export(module,{error:false});
