'use strict';
/**
 * # x-template
 * ============
 *
 * This module offers simple *DOM* based templating by merging in *JSON* and/or *DOM* data sets using *css* selectors.
 *
 * ## Example: DOM Template + JSON Data
 * ------------------------------------
 *
 * Assume you have the following JSON data:
 *
 *     var o = {
 *         users: [
 *             { person : { name: 'Joe'  , age: 20 , active:true,  address: { street: 's1' } } },
 *             { person : { name: 'Alice', age: 35 , active:false } },
 *             { person : { name: 'Bob'  , age: 40 , active:true  } }
 *         ]
 *     };
 *
 * combined with the following template:
 *
 *     <ul data-is=".users" >
 *         <li data-is=".person" >
 *             Name:<span data-is=".name">-</span><span data-if=".age">&nbsp;(<span data-is=".age"><span>)</span>
 *         </li>
 *     </ul>
 *     <span data-not=".users">No users available</span>
 *
 * the result is:
 *
 *     <ul>
 *         <li>
 *             Name:<span>Joe</span><span>&nbsp;(<span>20</span>)</span>
 *         </li>
 *         <li>
 *             Name:<span>Alice</span><span>&nbsp;(<span>35</span>)</span>
 *         </li>
 *         <li>
 *             Name:<span>Bob</span><span>&nbsp;(<span>40</span>)</span>
 *         </li>
 *     </ul>
 *
 *
 *
 * ## Example: DOM Template + DOM Data
 * -----------------------------------
 *
 *  Assume you have the following part of an RSS feed:
 *
 *  using the following template:
 *
 *      <section data-is="channel"
 *        <h1 data-is=">title">TITLE</h1>
 *        <a data-to-href=">link" data-$txt=">description" ><pan data-is="$txt">description</span></a>
 *        <ul data-if="item">
 *          <li data-is="item"><a data-to-href="link" data-$txt="title" ><pan data-is="$txt">news</span></a></li>
 *        <ul>
 *      </section>
 *
 *  the result is:
 *
 * The basic templating function is thus as follows: DOM x DATA -> DOM, where DATA = JSON or DOM (HTML/XML)
 *
 * Templating means here recursively walking top down and for each template DOM element
 *
 * - *select* a subset from the provided data
 * - *linking* a new DOM element for each result in the selected data
 * - *merge* the result into the result DOM element (data2dom)
 *
 *
 * ## Selecting Data
 * -----------------
 *
 * We all know how to use *css* selectors to query a tree of dom elements to get a result *set* of *DOM* nodes.
 * Here we use a syntax like the css selector syntax to perfrom a query on a tree of *JSON* data and get a as a result a *set* of JSON objects
 *
 * The syntax is described in [x-select](http://github.com/x-component/x-select)
 *
 * ## Linking DOM Element to Data with data- Attributes
 * ----------------------------------------------------
 *
 * A 'data-' attribute on a DOM element is used to define relation between a result DOM element and the selected data
 *
 * - **data-if**               clone this element if there is data
 *
 * - **data-not**              clone this element if there is no data
 *
 * - **data-is**               clone this element for each data object in the result set, then
 *                             merge the data object into the element and
 *                             use that value as data for all sub template elements
 *
 * - **data-to-'attribute'**   attribute is an attribute name where the result is rendered into. p.e. data-to-href
 *
 * ## Scope
 * --------
 * A DOM element is related to a result from a set found by a 'data-is'
 * selector. All selectors of sub elements are evaluated on this result data.
 * Therefore a DOM element with a data-is forms a implicit **data scope** for all subelements.
 *
 * You can escape from that scope using :root or a variable (see below)
 *
 * ## Data2DOM
 * -----------
 *
 * The real rendering is defined by an array of functions mapping a data object (JSON or DOM) into a DOM element
 *
 * There are some predefined renderers, you can add your own ones by passing them
 * in the options.data2dom as array.
 *
 * each renderer has the following interface:
 *
 *      function(element, value, options, next){
 *          // element  is the dom element where the value should be rendered into
 *          //
 *          // value    is what can be rendered into the element.
 *          //          This can be string, but also an object, or a DOM element
 *          //
 *          // options  option passed through from the main template call, you can use it p.e. to pass a logger
 *          //
 *          // this     for JSON rendering this is the js-traverse context of the value.
 *          //          this.key for example returns the name of the key at which value was found in an object
 *
 *          // **Here you can inspect the element and the value and maniupulate the dom tree**
 *          // be sure to call then next:
 *
 *          // next      Use next(null,value) and pass the (changed) value to the next handler
 *          //           or call next(true,value). True indicates you handled the value and no further 
 *          //           data2dom handler is called.
 *          //
 *          //           The passed value is used by the next data2dom handler and data-is templating scope for sublements
 *      }

 * The following data2dom handlers are predefined:
 *
 * date     if the *key* of the value contains Date or date the value is formated using the given html lang and put into the elements innerHTML
 * url      if the *key* of the value is url and the el has a  href, action, src attribute the url is rendered in that one.	
 * input    renders values for input fields:
 *          textarea: set value in innerHTML
 *          input, select, option, button set the attribute value (not for type checkbox)
 * img      set the src of the image
 * text     default replace the elements textContext with a value convertet to string, if it is not an object
 * dom2dom  This renders the value if the value is an dom element.
 *          As this can be quite complex you can pass a debug:true in the options, to get some extra comments in the result
 *          to see what happened.
 *
 *          attribute handling
 *          -------------------
 *          Attribute values are copied: a simple set, the 'class' attribute is different: value are concatenated, seperated by blanks.
 *          The following attributes in the template element can define what should be copied/merged. Values are whitespace separated:
 *          'data-attributes'         which attributes can be copied,          * means all
 *          'data-attributes-exclude' which attributes should *not* be copied, * means all
 *          'data-class'              which classes should be added,           * means all
 *          'data-class-exclude'      which classes should *not* be added,     * means all
 *
 *          Inner HTML
 *          'data-option'            if this contains 'inner' then the complete innerHTML is copied 1:1
 *
 *          text node handling
 *          ------------------
 *          'data-exclude-texts'     Use true to indicate *not* to copy text nodes
 *
 *          All text nodes from the target are replaced each by those of the source. Note that text nodes can
 *          occur multiple time inbetween the subelementes of the template element. Hence this rule.
 *          If the target has more text nodes then the source these are removed.
 *          If the source has more they are appended at to the last one.
 *
 *
 * ## Apply / Recursion data-apply
 * -------------------------------
 * 'data-apply' Is a template attribute containing a DOM css selecter of the template (not the data source!)
 *              which defines the next elements to be used as child elements of the current template element during templating.
 *
 * This allows to use arbritray snippets of a page as templates and break up a single template in smaller parts.
 * More important it allows to template recursive structures of arbitray depth.
 * Example: A backend sends a tree with nodes like a->b->(c,d->(x,y,z))
 *
 * data:
 *
 *      { node: 'a', children:[
 *          { node:'a.1', children: [
 *              { node:'a.1.I' },
 *              { node:'a.1.II', children: [
 *                  { node: 'a.1.II.X'},
 *                  { node: 'a.1.II.Y'},
 *                  { node: 'a.1.II.Z'}
 *              ]}
 *          ]},
 *          { node: 'a.2', children: [
 *              { node: 'a.2.I'},
 *              { node: 'a.2.II'}
 *          ]}
]*       }
 *
 * template:
 *
 *     <div data-template="node-content">
 *         <span data-is="> .node"></span>
 *         <ul   data-if="> .children" >
 *             <li data-is="> .children" data-apply=":root [data-template='node-content']" ></li>
 *         </ul>
 *     </div>
 *
 * result:
 *
 *     <div data-template="node-content">
 *         <span>a</span>
 *         <ul>
 *             <li><div data-template="node-content">
 *                 <span>a.1</span>
 *                 <ul>
 *                     <li><div data-template="node-content"><span>a.1.I</span></div></li>
 *                     <li><div data-template="node-content"><span>a.1.II</span>
 *                         <ul>
 *                             <li><div data-template="node-content"><span>a.1.II.X</span></div></li>
 *                             <li><div data-template="node-content”><span>a.1.II.Y</span></div></li>
 *                             <li><div data-template="node-content"><span>a.1.II.Z</span></div></li>
 *                         </ul>
 *                     </div></li>
 *                 </ul>
 *             </div></li>
 *             <li><div data-template="node-content">
 *                 <span>a.2</span>
 *                 <ul>
 *                     <li><div data-template="node-content"><span>a.2.I</span></div></li>
 *                     <li><div data-template="node-content"><span>a.2.II</span></div></li>
 *                 </ul>
 *             </div></li>
 *         </ul>
 *      </div>
 *
 * Note: The attribute name 'data-template' is just a convention, anything can be used by the data-apply selector.
 *
 *
 * ## Variables 'data-$' (experimental)
 * ------------------------------------
 * 'data-$' Can be used to reuse a set of results within a scope and thus to simplifies the
 *          templates extracting otherwise repeated expressions.
 *
 * The following example extracts all images from all paragraphs,
 * and then renders the paragraphs and appends a list of all images found in the paragraphs:
 *
 *      <div data-$img="p img" ><!-- store the results set in $img for this scope -->
 *          <p data-is="p" data-option="inner"><p>
 *          <ul class="gallery" data-if="$img"><!-- use the set $img, check if it is empty -->
 *              <li data-is="$img ><!-- generate a li for each image -->
 *                <img class="thumbnail" data-option="self" data-is=">img" /><!-- use that image to render it here -->
 *              </li>
 *          </ul>
 *      <div>
 *
 *
 * Note: In fact the templating engine also uses a simple mnemonization within a scope.
 * Thus in a template with <ul data-if=".persons" ><li data-is=".persons" >...</li></ul>
 * the expresion .persons is evaluated just once. If the 'same' selector was already evaluated
 * in the same scope it is expected to be the same result set.
 * If a selector is the same as an other one, is for now simply checked by a string comparison.
 *
 * Note: you can not (yet) use variable somewhere in a selector, they
 * only can replace a whole selector for now.
 *
 * ## Options: data-option
 * -----------------------
 * Options to influence templating behavior can be set in the template using 'data-option' the values are blank separated.
 *
 * invisible  The element it self will be removed after templating the subnode are added to the parent.
 *            p.e. "Pack my box with<span data-options="invisible" data-is=".txt">five</span> dozen liquor jugs." 
 *            and {txt:'sixty five'}
 *            becomes "Pack my box with sixty five dozen liquor jugs.
 *
 * self       Allows the selector to match the data forming the scope to be matched. It thus match itself. 
 *
 *            Example: Normally one decents through the data as scopes level by level:
 *
 *            <div data-is=".person">
 *               <span data-is=".name"></span>
 *               <span data-is=".age"></span>
 *            <div>
 *
 *            and {person:{ name: 'John', age:20 }}. Each rendered div is associated a found person:{...} 
 *             the spans scope for the selector is that person. 
 *
 *            The folloging however works only because of "self"
 *             <div data-is=".person"><p data-is=".name, .age" >
 *               <span data-option="self" data-is=".name"></span>
 *               <span data-option="self" data-is=".age"></span>
 *             </p><div>
 *
 *            The scope of <p> selector is the object of person: {...}. The p is thus rendered twice.
 *            The scope of each span is then for first <p> the value 'John', and for the second <p> the value '20'.
 *            The option self allows the selector of the span to match the value again.
 *
 *
 * the following options are only used with dom2dom templating:
 *
 * inner      The innerhtml of the src is copied 1:1 to the target
 *
 * texts      All text nodes of the *source* will be wrapped in <span class="text">, this allows to walk through als text nodes combined with tags ( p.e. paragraphs)
 *            and keep the order of textnodes / elements as is. see example below:
 *
 * Example for the option texts:
 *
 * Imagine you have a paragraph with <br/> and *nested* spans
 *
 *      <p class="fancy" >Lorem ipsum dolor sit amet,<br/>
 *         <a class="funny" href="/abcd" >consectetur adipiscing elit.
 *            <span>Vivamus pulvinar <span>lectus</br>
 *            in</span> felis dignissim,</span>
 *            nec <strong>vulputate <br/>diam <strong>lobortis</strong>.<br/>
 *            Cras nisl diam, faucibus eget<img src="/my-huge-image" />
 *        </a>
 *        vulputate vitae, lacinia eu lorem.
 *      <p>
 *
 *  now we could either use 'inner', then the complete content is copied as is.
 *
 *     <p data-option="inner" data-is="p" >
 *
 *  or we parse recursively through the paragaph and replace some tags, p.e. the <br/> by a <span class="break"></span>
 *  and remove the image tags:
 *
 *     <p data-option="self texts" data-is="> p" data-exclude-texts="true" >
 *         <!--
 *            NOTE: the option 'texts' causes that text nodes as children of p are wrapped in spans
 *            so the next > span.text  matches the text nodes.
 *            First we match all allowed elements in an invisible span, this way we preserve the order of all sub elements
 *
 *         -->
 *         <span data-template="paragraph-content" data-option="invisible" data-is="> a, > br, > span, > strong, data-exclude-texts="true" data-exclude-attributes="*">
 *               <a      data-option="self"           data-is="> a" href="#" data-exclude-texts="true"         data-apply=":root [data-template='paragraph-content']" ></a>
 *               <span   data-option="self"           data-is="> br"  class="break"></span>
 *               <span   data-option="self"           data-is="> span[class!=text]"  data-exclude-texts="true" data-apply=":root [data-template='paragraph-content']" ></span>
 *               <span   data-option="self invisible" data-is="> span.text"                                    data-apply=":root [data-template='paragraph-content']" ></span>
 *               <strong data-option="self"           data-is="> strong"             data-exclude-texts="true" data-apply=":root [data-template='paragraph-content']" ></strong>
 *               <!-- artificial text spans are matched here, invisible removes them from the result -->
 *               <span   data-option="self invisible" data-is="> span.text"   data-apply=":root [data-template='paragraph-content']" ></span>
 *         </span>
 *     </p>
 *
 *  The result is then:
 *
 *
 * ## I miss a feature / rendering
 * -------------------------------
 * As you can see templating already offer a log of things.
 * If you are missing a feature think of the following options you have:
 *
 * (1) Extend the list of data2dom handlers and pass an array of your own data2dom handlers in the template options
 *
 *   p.e. a special renderer can load subsequent missing data from backends if they a requested by rendering.
 *   An other own render could format values before the are rendered.
 *
 *   Note that within a data2dom handler you have full access to the element, you can thus add your own 'data-' attribute extensions or own possible 'data-option' contents
 *
 * (2) Don't put to much logic the templates. Better is to prepare the data upfront so rendering becomes easier:
 *
 *   For example instead of using the following complex expression in each template *everywhere* to check the data state
 *   to decide to render an edit link or not:
 *
 *   <a href="/edit" data-if="((.user .rights .edit ) or (.user .roles:contains('admin') )) and (.user )" >Edit</a>
 *
 *   prepare the data at a central place in code:
 *
 *   if(data.user && (user.rights.edit || ~user.roles.indexOf('admin')) ) { data.edit = true }
 *
 *   and use in the template just:
 *
 *   <a href="/edit" data-if=".edit" >Edit</d>
 *
 *  As soon as you think about templating templates, propably something is going wrong: Move it to code if possible.
 *
 *  Still missing a feature? Have an awesome general data2dom handler? post an issue / submit a pull request!
 *
 *
 *
 * # template(element, data, options, callback(err,element))
 * ----------------------------------------------------
 * @param element            the DOM element to use a template
 * @param data               the JSON object or DOM element to use as data input
 * @param options.data2dom   an array of data2dom handlers to user before the default onews
 * @param callback.err       err which occurs
 * @param callback.element   the new template element (normally the passed element to template is templated in place)
 */

/*!
 * # Rationale
 * ---------
 *
 * ## Why *DOM* templating?
 * ------------------------
 *
 * ### Reuse, Speed:
 *
 * Using DOM templating meanse we clearly seperate **parsing**, **evaluating** and **rendering** templates:
 *
 * parsing (HTML5 -> DOM) ->  templating((DOM x DATA) -> DOM)  ->  rendering(DOM -> HTML or DOM->LAYOUT ENGINE->SCREEN)
 *
 * This allows to reuse the built in "parser" within every internet browser out there. These are fast and error tolerant.
 * Normal browser developer tools can be used to inspect the parsed "syntax tree".
 *
 * "rendering" to HTML markup is just needed at the server side. 
 * Inside a browser, the browser itself "renders" directly to the layout engine.
 *
 * We thus try not to reinvent a new templating language syntax but to reuse welknown HTML5 and css selector syntax.
 *
 * A DOM subtree thus represents the parsed template syntax tree and
 * we evaluate the template in the context of data by transfroming the DOM tree to its final structure.
 *
 * ### Robust Integration, Future Proof:
 *
 * Another advantage of choosing HTML as template syntax is that this ensures that our syntax can never create any conflict with
 * existing tools or other template engines. Therefore we can use directly the HTML from any content management system or
 * other templating systems to define a template as long as they produce HTML5, and without any escaping.
 *
 * Imagine something like {if}<div>{/if} {if}</div>{/fi} requires an own parser, can easily produce wrong invalid HTML, besides that it
 * looks ugly in a browser. HTML based templates can be used as click dummies.
 *
 * It can also become difficult to pass through your HTML templates through a CMS/templating backend system which itself uses `{ `}` for
 * its own custom templating. You must then rely on that system to allow and handle correctly escaping your own "special" characters.
 * Resulting in something like \{if\}<div>\{/if\} or {{{if}}}</div>{{{/fi}}} , imho very error prone.
 *
 * ### Extendability:
 *
 * You can easily extend pre- or post- processing by simple dom manipulation before/after templating.
 *
 * ### Negative aspects:
 *
 * - Not so easy to render just text, but you can use element.textContent
 * - Parsing into a DOM is by far more expensive then parsing a more simple grammar or using regular expressions
 * - Expensive layout reflows during templating. They can be prevented
 *   by templating subelements of a DOM fragment, and add the result
 *   node at the end in the final DOM tree.
 * - A lot of `<span>` tags. Wel you can use a custom element `x` and style it as inline, so you get `<x data-is="" />`
 *   and even add a preprocessing, so translate thing like <x is="...."></x>
 *
 * ## Why JSON selectors?
 * ---------------------
 *
 * ### Expressiveness
 * ------------------
 *
 * Using just a string like {name} or a path accessor like {person.name} is just as
 * complex as using a selector:  {.name } or {.person >.name}. Selectors
 * though are more flexible especially when using deep nested structures.
 *
 * The advantage is simular as using css to select DOM element **sets**, instead of navigating through the DOM tree directly.
 *
 * By handling always **sets** the template language stays small and there is no imperative stuff like loops, repeat.
 * It is also less error prone: What happens if there is no data, if it not an object but an array etc.
 * Changing a data structure to use an array, may leave the template untouched.
 *
 * Negative aspects:
 * - By using selectors like ".person .name", you can have the undesired effect that if an sub object of .person
 *   becomes also a ".name" element, p.e. the person becomes an array of friends which each have a .name
 *
 *   To prevent this you can explicitly qualify the path ".person>.name" so name is required to be immediate child of person.
 *
 *
 * ### Flexibility, Robustness
 * ---------------------------
 *
 * Just like css selectors it is insensitive against some changes,
 * especially against grouping of attributes or changing them to sets.
 * This is not unlikely for a data model as it means evolving from a
 * single object to a 1:1 relation ship to maybe to a 1:n relationship
 * between objects in a data model.
 *
 * Image you use a REST API that changes from
 *
 *      {person: { name: 'Joe', address:{street:'Marienplatz'} }
 *
 * to
 *      { person: { name: 'Joe', address:[ { type: 'home', street:'Marienplatz'} },{ type: 'work', street: 'Ringstr 15' } ] }
 * or
 *      { person: { name: 'Joe', address: { home: { street:'Marienplatz'}, { work: { street: 'Ringstr 15' } } }
 *
 *
 * Then a template:
 *
 * <div data-is=".person" ><span data-is=".name">-</span>
 *    <div data-is=".address" ><span data-if=".street">Street:<span data-is=".street">-</span></span></div>
 * </div>
 *
 * will still work despite the changes.
 *
 * ### Negative:
 *
 * - The query language is quite powerfull, such that instead of
 *   changing code to deliver a adequate data source, templates start to
 *   contain to much selection logic
 *
 * ### What about partials?
 * ------------------------
 * Many templating engines, have directives ton include elementes to combine HTML snippets to
 * new ones and to complete pages.
 *
 * This involves two taks: *receiving* the partial template resource, and *applying* the partial template.
 *
 * For now we do not consider *receiving* a partial template a part of the templating itself.
 *
 * This composition can either be achieved upfront by a CMS, by preprocessing using
 * HTML Imports http://w3c.github.io/webcomponents/spec/imports/ , or by using
 * <script type = “text/template”> … </script>
 * and/or doing this on demand by extending  dat2dom rendering. Note
 * because templating is asynchronic, it can also load asyncronic
 * resources data/template snippets during the templating.
 *
 * *Applying* a partial template is however covered by a build in directive:
 *
 * This away you can template also recursive structures like trees.
 *
 * ## Why is there no data-else?
 * -----------------------------
 * ## Why is there no updating of values?
 * --------------------------------------
 * ## What is the sequence?
 * ------------------------
 *
 * The templating 'language' using data-is/if/not is *declerative not *imperative*. We define only what we want, not how.
 * There is thus no predefined order in wich subelements must be
 * evaluated. To keep this property we do not promote the change of data
 * during evaluation. New data can be added but everything is assigned
 * once and stays then immutable.
 *
 * This has some advantages:
 *
 * ### Asynchronic
 * ---------------
 * Because we have no predefined order, we *can* split up the evaluation in
 * multiple parrallel *asynchronic calls.
 * In the current implementation nodes are in fact evaluated in an asynchronic queue. Depending
 * on the evaluation speed and scheduling the order may change. This
 * allows for example retrieving data and template parts on demand
 * using HTTP requests, and proceed the templating evlauation while awaiting results.
 *
 * ### Optimizations
 * -----------------
 * As long as the result set stays the same we can change the
 * implementation of selector evaluation. For example we introduced
 * mnemonization of results based on the selector string, because within a scope
 * the same selector string results in the same result set. We can do
 * this as there are no side effects.
 *
 * ### Negative
 * ------------
 * This may seam to restrict the expressiveness, in fact it opens up the
 * way for future optimzation without breaking existing templates.
 * If one would allow a complete imperative statefull language the
 * amount of logic within templates is going to increase. This logic is
 * better added to rendering logic or data preparation upfront.
 *
 * So data-else is in fact covered by a <data-not="epr"> which can be
 * isolated evaluated by it self.
 *
 * ## Known Limitations
 * -----------
 * - two way data binding  (todo explain)
 */
var
	async    = require('async'),
	select   = require('x-select'),
	format   = require('x-format'),
	logutil  = require('x-log'),
	dom      = require('x-dom'),
	callback = require('x-callback'),
	extend   = require('x-common').extend,
	bool     = require('x-common').bool,
	set      = require('x-common').set;


var M;
module.exports = extend(M=function F(el/*!dom element*/,obj/*!json or dom data*/,options/*!{root, data2dom, dom2data}*/,end/*!( err, el )*/){
	
	//optional parameter options
	if( 'function'===typeof(options) ){ end=options; options={}; }
	
	options = extend({root:obj,log:logutil}, options);
	
	var
		root  = options.root,
		log   = options.log;
	
	if(!el){ end && end(null,el); return; }
	
	var queue = async.queue(function(task/*!element,data*/,done){ // worker function handling templating for a single element
		// done will called after enqueuing jobs for childen of the element or
		// directly if the element is handled by a dom2data mapper withing a data-is
		var
			el      = task.element,
			data    = task.data, // object, context
			next    = null,
			TEXT    = 3,
			enqueue = function(el, next ){
				if(el && next.length === 0){
					// normal empty tag or root
					// next job: if element not already removed traverse children
					next.push({ parent: el, data: data });
				}
				
				if ( el && el._template) F.remove(el); // el was cloned as template instance
				
				// data-template: use the provided selector to define the next children to apply templating to.
				// This allows (re) using embedded templates is thus a prerequisite for *recursive* template application
				// for example to template a tree data structures with a single node template
				for(var n=0,count_next=0,nl=next.length;n<nl;n++){
					var
						parent = next[n].parent,
						set,
						expr,
						opt       = parent && parent.getAttribute && (expr=parent.getAttribute('data-option')),
						invisible = opt && (!!~(' '+expr+' ').indexOf(' invisible ')),
						texts     = opt && (!!~(' '+expr+' ').indexOf(' texts '));
					
					if( parent.getAttribute && (expr=parent.getAttribute('data-apply')) && (set=select(parent,expr,{root:options.documentClone}))){
						// NOTE data-apply is a css select on the template document itself *NOT* on the data to render!
						set.forEach(function(node){
							F.importNode(parent,node,options);
						});
					}
					
					F.dataAttributes(parent); // remove template data-* stuff, and rename the data-data-* to data-
					
					var children=[].concat(parent.childNodes);
					for(var i=0,l=children.length;i<l;i++){
						var child=children[i], child_data = next[n].data, child_object = child_data ? child_data.object : null;
						if( texts && child_object ){ // wrap DATA text nodes in spans with class "text", so they can be transformed
							child_data.object = F.createTextSpans( child_object );
						}
						queue.push({ element: child, data: child_data },function (err) {
							if(err) log.error && log.error(err);
						});
					}
					
					if( invisible ){ // move children where parent is
						F.invisible(parent);
					}
				}
				done();
			},
			expr,
			set;
		
		if(el && !options.debug) el=M.compress(el);
		
		//if( el && data ) el.___data = data; // store the used binding, undefined for root
		
		if(el && el.getAttribute){ // note the dom document root and text nodes do not have attributes
			
			var opts={root:root}, object = data.object;
			
			// f option self is used, the current context is used withing include the select query.
			// Note: data-option="self" data-is="> *" selects exactly the context node what ever it is
			if(el && (expr=el.getAttribute('data-option' )) && (~(' '+expr+' ').indexOf(' self ')) ) opts.self = true;
			
			// check set definitions: data-$name=".foo"
			if(el) for(var ai = 0, as = el.attributes, al = as.length; ai < al; ai++) {
				var
					attr    = as.item(ai),
					name    = attr.name,
					def     = 'data-$',
					to_attr = 'data-to-';
				
				if(name.substring(0,def.length)===def){
					expr = name.substring(def.length-1)+'='+attr.value;
					M.set(data,object,expr,opts,log);
				}
				
				if(name.substring(0,to_attr.length)===to_attr){
					set=M.set(data,object,expr,opts,log);
					var value = set.first();
					if(value){
						el.attr(name.substring(to_attr.length),''+(value||''));
					}
				}
			}
			
			if(el && (expr=el.getAttribute('data-if' )) && (set=M.set(data,object,expr,opts,log)) &&  set.empty() ) el=F.remove(el);
			
			if(el && (expr=el.getAttribute('data-not')) && (set=M.set(data,object,expr,opts,log)) && !set.empty() ) el=F.remove(el);
			
			if(el && (expr=el.getAttribute('data-is' )) && (set=M.set(data,object,expr,opts,log))){
				
				var values=[];
				set.forEach(function(value){
					values.push({context:this,value:value});
				});
				if( 0===values.length ){ // empty, then remove like for data-if
					el=F.remove(el);
				}else{
					var d_opt=el.getAttribute('data-option'),pass = d_opt && (!!~(' '+d_opt+' ').indexOf(' pass '));
					
					next=[]; // this prevents a double enqueue as now next != null,
					         // note: data2dom is asynchronic and thus will call enqueue at a later point in time
					
					for(var v=0,vl=values.length,count=0; v<vl; ++v){
						var value=values[v].value, context=values[v].context;
						var set_el=F.clone(el);
						
						if(context)context.msisdn=root.msisdn; // add msisdn to context
						//log.debug && log.debug('before data2dom: expr:'+expr+',value:'+( value ? typeof(value)+'/'+value.tagName +'('+value.nodeType+')':'-') );
						
						F.data2dom.apply(context,set_el,value,options,function(set_el,value,pass,data){ return function(err,new_value){
							
							//if(/.../.test(expr)) debugger;
							
							count++; // count call backs
							var stop = err===true;
							if(!stop){
								
								//log.debug && log.debug('after data2dom: expr:'+expr+',value:'+(value ? typeof(value)+'/'+value.tagName+'('+value.nodeType+')':'-')+',new_value:'+ ( new_value ? typeof(new_value)+'/'+value.tagName+'('+new_value.nodeType+')':'-'));
								value = new_value || value; // data2dom mapper can redefine the value
								
								if(typeof value === 'object' && !Array.isArray(value)) value=[value]; // object is handled like array with one element
								
								if(Array.isArray(value)){
									// for the first value [0] we traverse the current element
									if(0 in value)next.push({ parent:set_el, data: pass ? data : {object:value[0], context:context, parent:data} });
									
									// for each next found entry [1..n] we clone the element to display lists of values
									// and next job is: traverse children of new element with corresponding value
									for(var i=1,l=value.length;i<l;i++){
										if(set_el = F.clone(el)){ // jshint ignore:line
											next.push({ parent:set_el, data: pass ? data : {object:value[i], context:context, parent:data} });
										}
									}
								}
							} else {
								M.dataAttributes(set_el);
							}
							if(count===vl) enqueue(el,next); // perform enqueue and thereby done once per task
						}; }(set_el, value, pass, data)); // jshint ignore:line
					}
				}
			}
		}
		
		if(next===null){ // if next != null this is handled within data-is
			enqueue(el, [] );
		}
	},100);
	
	// if all tasks are handled
	queue.drain=function(){
		end && end( null, el );
	};
	
	(function(cb){
		if(!options.documentClone){
			
			M.documentClone(el,callback(function(err,doc){
				if(err){
					log.error && log.error('could not get document for data-template evaluation');
					end && end( null, el );
					end = null;
					return;
				}
				options.documentClone = doc;
				cb();
			}));
		} else cb();
	})(function(){
		queue.push({element:el, data:{object:obj}});
	});
},{
	// this analyses the string to be a variable assignment or reference and
	//
	// we store them at data.vars={"selector": set , "$varname": set }
	//
	set: extend(function F(data, object, expr, opts, log){
		expr = expr ? expr.trim() : '';
		log  = log || {};
		
		var m        = expr && expr.match(F.var_expr),
			is_var   = !!m,
			name     = m ? (m[1] ? '$' + m[1].trim() : '$?' ): (expr || '').trim(),
			assign   = m ? '=' === m[2] : true,
			val_expr = m ? m[3] : expr,
			vars     = data.vars = data.vars || { toJSON:F.toJSON }, // define toJSON for logging
			val      = vars[name],
			set;
		
		// memoization of a value ="selector"
		// the set of values is returned immediately if already stored before
		// or the selector is evaluated, the result stored to the current scope and then returned
		if(!is_var){
			set=( val ? val : (vars[name]=(val_expr ? select(object, val_expr, opts) : null )));
			return set;
		}
		// variable assignments ="$name=selector"
		// values are evaluated stored to the current var scope and then returned
		if(assign){
			//debugger;
			if(val){
				log.error && log.error('templating variables: double assignment of variable within the same scope, last wins.',{name:name, vars:data.vars, expr:val_expr});
			}
			set=(vars[name]=(val_expr ? select(object, val_expr, opts) : null ));
			return set;
		}
		
		// variable references ="$name" may walk up the scope parent hierarchie
		var d=data;
		while(!val && (d=d.parent) && (vars=d.vars)){
			val = vars[name];
		}
		if(!val){
			// log the nested scopes
			vars = data.vars; d=data;
			var scopes=[vars];
			while((d=d.parent) && (vars=d.vars)){
				scopes.push(vars);
			}
			log.error('templating variables: no value found for variable',{name:name, scopes:scopes});
		}
		set=val;
		return set;
	},{
		var_expr: /\s*\$([^=]*)(=*)(.*)/,
		// monkey path all contained DOM result nodes so toJSON returns their path
		toJSON: function(){
			var result={};
			for( var name in this ){
				if(typeof(this[name])!== 'object') continue;
				var value=result[name]=this[name];
				if(!Array.isArray(value)) value=[value];
				for( var i=0,l=value.length;i<l;i++){
					var o=value[i];
					if('nodeType' in o){
						o.toJSON=function(){
							var el=this,path=[];
							do {
								path.push(el.tagName+('_index' in el ? '#'+el._index : ''));
							} while(el && (el=el.parentNode) && el.tagName );
							return path.reverse().join('/');
						};
					}
				}
			}
			return result;
		}
	}),
	remove:function(el){
		if(el && el._placeholder && el._placeholder.parentNode) el._placeholder.parentNode.removeChild(el._placeholder);
		if(el && el.parentNode) el.parentNode.removeChild(el);
		return null;
	},
	insertAfter:function(new_el, el){
		var parent = el.parentNode, sibling = el.nextSibling;
		if(parent){
			if(sibling){
				parent.insertBefore(new_el, sibling);
			}else{
				parent.appendChild(new_el);
			}
		}
	},
	prependChild:function(parent, el){
		if(parent.firstElementChild){
			parent.insertBefore( el, parent.firstElementChild );
		}else{
			parent.appendChild( el );
		}
	},
	clone:function(el){
		try {
			if(!el._placeholder){ // use a genric place holder to mark position because the clone may have the same id!
				el._placeholder = el.ownerDocument.createElement('span');
				el._placeholder.setAttribute('data-tmp','template-placeholder'); // this is just a marker to identify the origin of element if something goes wrong
				el.parentNode.insertBefore(el._placeholder,el);
				el.parentNode.removeChild(el);
			}
			
			var
				parent = el._placeholder ? el._placeholder.parentNode : null,
				new_el = null;
			
			if(parent){
				new_el = el.cloneNode(true);
				el._template = true; // mark as used as template
				parent.insertBefore(new_el,el._placeholder);
			}
			return new_el;
		}catch(error){
			if (logutil.error) logutil.error(__filename + ' Exception in template2.js/clone: ' + error);
		}
	},
	documentClone:function(el,cb){
		var doc = el.ownerDocument || el;
		
		if(doc._clone){ cb(null,doc._clone); return; }
		
		dom.parse(doc.innerHTML,callback(function(err,win){
			doc._clone=win.document;
			cb(err,doc._clone);
		}));
	},
	createTextSpans:function F(node){
		// use a flag to prevent going over and over the same nodes
		if(node.__donetext2spans) return node;
		node.__donetext2spans=true;
		
		var TEXT = 3;
		if( TEXT === node.nodeType ){
			var
				doc = (node.ownerDocument || node ),
				parent = node.parentNode;
			
			if( doc.createElement && parent
			    // do not wrap a text if text in a span and
			    && !(parent.tagType === 'SPAN' &&
			           ( ( parent.getAttribute && ~(''+parent.getAttribute( 'class' )).indexOf( 'test' )) // already is a wrapped text node
			          || !(node.nextSibling || node.previousSibling) // or is a single child with no siblings
			           )
			        )
			){
				var span = doc.createElement('span');
				parent.insertBefore(span, node);
				span.appendChild(node);
				span.setAttribute('class', 'text');
				span.setAttribute('data-tmp', 'added-text-span');
				node = span;
			}
			node.__donetext2spans=true;
		} else {
			// recursive create text spans for all children
			var nodes = node.childNodes;
			if(nodes && nodes.length){
				var children=[].concat(node.childNodes);
				for(var i=0,l=children.length;i<l;i++){
					F(children[i]);
				}
			}
		}
		return node;
	},
	removeAttribute:function(el,name){
		//debugger;
		
		el.removeAttribute(name);
		if(el._attrsByLName['null|'+name]){ // patch fix for domino error
		   delete el._attrsByLName['null|'+name];
		   el._attrKeys = Object.keys(el._attrsByLName);
		}
	},
	dataAttributes: extend(function F(el){
		if(!el || !el.setAttribute) return;
		
		var as = el.attributes;
		if(as && as.length){
			var data=[],data_data=[]; // collect data- and data-data- attributes
			for(var i = 0, l=as.length; i<l; i++){
				var attr=as.item(i), name = attr.name, value= attr.value;
				if(/^data\-/.test(name)){
					if( /^data\-data\-/.test(name) ){
						data_data.push({name:name,value:value});
					} else {
						// remove data-.. used by templating and also data-$
						if( ( name in F.names) || (name.length > 5 && '$'===name[5])){
							data.push({name:name,value:value});
						}
					}
				}
			}
			for(var di=0, dl=data.length; di<dl; di++){ // remove the template data-* attributes
				M.removeAttribute(el,data[di].name);
			}
			for(var ddi=0, ddl=data_data.length; ddi<ddl; ddi++){ // set new data attributes
				var ddattr=data_data[ddi];
				el.setAttribute(ddattr.name.substring(5),ddattr.value);  // 5 == 'data-'.length
				M.removeAttribute(el,data_data[ddi].name);
			}
		}
	},{
		names:{
			'data-is'                : true,
			'data-if'                : true,
			'data-not'               : true,
			'data-query'             : true, // TODO remove this old stuff
			'data-querykey'          : true, // TODO remove this old stuff
			'data-option'            : true,
			'data-apply'             : true,
			'data-exclude-attributes': true,
			'data-exclude-texts'     : true,
			'data-attributes'        : true,
			'data-class'             : true,
			'data-exclude-class'     : true
		}
	}),
	invisible:function(el){
		var
			children=[].concat(el.childNodes),
			parent = el.parentNode;
		if ( parent ){
			for(var i=0,l=children.length;i<l;i++){
				parent.insertBefore(children[i],el);
			}
			parent.removeChild(el);
		}
	},
	importNode: function(parent,node,options){
		var
			do_import = (node.ownerDocument || node ) === options.documentClone,
			new_node= do_import ? ((parent.ownerDocument || parent).importNode(node)) : node.clone(true);
		
		if(do_import) new_node.innerHTML=node.innerHTML;
		parent.appendChild(new_node);
		return new_node;
	},
	compress:extend(function F(el){ var COMMENT=8, ELEMENT=1, TEXT=3;
		     if( COMMENT===el.nodeType ) el=M.remove(el); // remove comments if not in debug mode
		else if( ELEMENT===el.nodeType && !F.sensitive[el.tagName]) { // copy array as nodes can be removed
			for(var i=0, cs=[].concat( el.childNodes), l=cs.length, c; i<l; ++i ){ c=cs[i];
				if( TEXT===c.nodeType )F.whitespace(c,true);
			}
		}
		
		return el;
	},{
		whitespace:function(text_node,modify_dom){
			
			// See also
			// http://www.w3.org/TR/html401/struct/text.html#h-9.1 and
			// http://code.google.com/p/modpagespeed/source/browse/trunk/src/net/instaweb/rewriter/collapse_whitespace_filter.cc
			var
				str=''+text_node.textContent,
				str_new=str.replace(/([ \t\r\f\n\u200b])[ \t\r\f\u200b]*/g,'$1' /*!'\n'*/ ); // preserve just the first white space
			
			str_new=str_new.replace(/[ \t\r\f\u200b]\n/g,'\n'); // if one white space before new line replace by newline
			str_new=str_new.replace(/[\n]{1,}/g,'\n'); // remove multiple new lines
			// note we do not remove empty text nodes, to keep
			// template replacement behavior equal if compressed or not
			// empty nodes are elimnated anyway on serialization to html
			if(str!==str_new){
				var
					text_node_new = text_node.ownerDocument.createTextNode(str_new),
					p = text_node.parentNode;
				if(p && modify_dom) p.replaceChild(text_node_new,text_node);
				text_node=text_node_new;
			}
			return text_node;
		},
		sensitive:{PRE:true,SCRIPT:true,STYLE:true,TEXTAREA:true}
	}),
	
	lang:function(el){
		var lang;
		while(!(lang=el.lang) && (el=el.parentNode));
		return lang;
	},
	
	// data2dom is a global set of functions(el,v,next), which are called if a value v is to be merged into to an dom element el
	// 'this' contains the context of v. Examples:
	// - this.key desribes the key used to acces the property with value v,
	// - this.path desribes the path of the value in the json structure
	//   see js_traverse documnetation for more info about this context
	// - when finished the map function should call next an pass either an err, null for real errors, true,null to stop propagation, null,new value to continue 
	//
	// the data2dom is executed in order of the array, if a data 2 dom map function calls next(true), the next mappers are not evaluated
	data2dom:extend([
		
		//-- DATE format as date if property key ends with 'Date'
		function date(el,v,opts,next){
			if ( v && (typeof v==='string' || typeof v==='number' || v instanceof Date ) && this && this.key && (/[Dd]ate$/.test(this.key))) {
				el.innerHTML = format.date(v,{locale:M.lang(el)});
				next && next(true,null);
				return;
			}
			next && next(null,v);
		},
		
		//-- A, FORM, IMG with property key 'url', sets the href,action,src
		function url(el,v,opts,next){
			var an;//attribute name
			if ( v && typeof v === 'string'
			  && ((an='href', el[an]) ||  (an='action', el[an])  || (an='src', el[an]))
			  && this && this.key && this.key==='url'
			   ) {
				el[an] = v;
				next && next(true,null);
				return;
			}
			next && next(null,v);
		},
		
		//-- INPUT, SELECT, TEXTAREA, OPTION, BUTTON set the value
		extend(function input(el,v,opts,next){
			if(input.regexp.test(el.tagName) &&
			   !(typeof v === "undefined" &&
			   v === null &&
			   typeof v === 'object' &&
			   v.nodeType) ) {
					if (el.tagName.toLowerCase() === 'textarea') {
						el.innerHTML = ''+v;
					} else if ( !el.getAttribute('type') ||
							    (el.getAttribute('type') &&
								 el.getAttribute('type').toLowerCase() !== 'checkbox') ) {
						el.setAttribute('value','' + v);
					}
				next && next(true,null);
				return;
			}
			next && next(null,v);
		},{regexp:/input|select|textarea|option|button/i}),
		
		//-- IMG set the src
		extend(function img(el,v,opts,next){
			if(img.regexp.test(el.nodeName) && !(v && typeof v === 'object' && v.nodeType) ){
				el.setAttribute('src',v);
				next && next(true,null);
				return;
			}
			next && next(null,v);
		},{regexp:/img/i}),
		
		//-- DEFAULT TXT replace text content
		function txt(el,v,opts,next){
			if (typeof v !== "undefined" && v !== null && typeof v !== 'object') {
				el.textContent=''+v;
				next && next(true,null);
				return;
			}
			next && next(null,v);
		},
		//-- DOM element as value
		function dom2dom(el,v,opts,next){
			//var log = opts.log || {};
			//log.debug && log.debug('in data2dom: el:'+(el ? typeof(el)+'/'+el.tagName+'('+el.nodeType+')':'-')+',v:'+(v ? typeof(v)+'/'+v.tagName+'('+v.nodeType+')':'-'));
			if( v && typeof v === 'object' && v.nodeType ){
				var
					comment  = opts.debug ? 'dom2dom:' : null, // for debugging dom2dom templating
					exclude_text = false;  // per default we copy text nodes
				
				if( comment ){
					var v_parent = v.parentNode, parents  = ['<'+v.tagName];
					while(v_parent){
						parents.unshift(v_parent.tagName);
						v_parent = v_parent.parentNode;
					}
					comment += parents.join('/');
				}
				
				// copy attributes but merge the class attribute
				if( v.attributes && v.getAttribute && el.getAttribute && el.setAttribute ) {
					var
						include=el.getAttribute('data-attributes'),
						exclude=el.getAttribute('data-exclude-attributes');
					// TODO use array of regexpr not just strings
					if( include ) include=include.split(/\s+/);
					if( exclude ) exclude=exclude.split(/\s+/);
					
					var
						include_class=el.getAttribute('data-class'),
						exclude_class=el.getAttribute('data-exclude-class');
					if( include_class ) include_class=include_class.split(/\s+/);
					if( exclude_class ) exclude_class=exclude_class.split(/\s+/);
					
					exclude_text = bool(el.getAttribute('data-exclude-texts'),exclude_text);
					
					for(var ai = 0, as = v.attributes, al = as.length; ai < al; ++ai){
						var a = as.item(ai), an = a.name, av = a.value;
						
						if( comment ) comment += ' '+an+'=\"'+av+'\"';
						
						if ( ( !include ||  (~include.indexOf(an) || ~include.indexOf('*') ) )// * includes all
						  && ( !exclude || !(~exclude.indexOf(an) || ~exclude.indexOf('*') ) )// * excludes all
						   ) {
							
							if ( an === 'class' ){ // merge classes
								var av_classes = av ? av.split(/\s+/) : null, av_selected_classes = '';
								for(var ci = 0, cl = av_classes.length; ci < cl; ++ci){
									var av_class = av_classes[ci];
									if ( ( !include_class ||  (~include_class.indexOf(av_class) || ~include_class.indexOf('*') ) )// * includes all
									  && ( !exclude_class || !(~exclude_class.indexOf(av_class) || ~exclude_class.indexOf('*') ) )// * excludes all
									   ) {
										av_selected_classes += ' '+av_class;
									}
								}
								av = (av_selected_classes + ' ' + ( el.getAttribute('class') || '').trim()).trim();
							}
							
							if ( /^data\-/.test(an) ) an='data-'+an; // escape data- with data-data- to prevent template data attribute conflicts, this data-data-* is set back to data- after the template data- attr. are removed
							
							el.setAttribute(an,av);
						}
					}
				}
				
				// check if not the complete inner html should be cloned
				var inner_opt = el.getAttribute('data-option'), do_inner = inner_opt && (!!~(' '+inner_opt+' ').indexOf(' inner '));
				if(do_inner){
					//debugger;
					var html = v.innerHTML;
					html = html.replace(/data\-/g,'data-data-');
					el.innerHTML = html;
				}
				// handle text nodes only
				else if(!exclude_text){
					// replace el text nodes with text nodes of the value node (v) in same order.
					var el_ci=0, el_cs=[].concat(el.childNodes), el_cl=el_cs.length, el_c,
						 v_ci=0,  v_cs=[].concat( v.childNodes),  v_cl= v_cs.length,  v_c,
						found, c_new, c_last, TEXT = 3;
					for (;el_ci < el_cl; ++el_ci ){
						el_c=el_cs[el_ci];
						if( el_c && TEXT===el_c.nodeType ){ // text
							found=false;
							do {
								v_c=v_cs[v_ci];
								++v_ci;
							} while( !(found=(v_c && TEXT===v_c.nodeType)) && v_ci < v_cl );
							if( found ){
								c_new=(el.ownerDocument || el).importNode(v_c);
								if(!opts.debug) c_new=M.compress.whitespace(c_new);
								if(c_new){
									el.insertBefore( c_new, el_c); // replace text node in el with text node from v
									c_last=c_new;
								}
							}
							// if el has more text nodes than value node (v), do always remove them
							M.remove(el_c);
						}
					}
					// if value node (v) has more text nodes, add its text nodes after the last text node of the lhs element node (el)
					while( v_ci < v_cl ){
						var sibling=c_last; v_c=v_cs[v_ci];
						++v_ci;
						if( v_c && TEXT===v_c.nodeType ){
							c_new=el.ownerDocument.importNode(v_c);
							if( !opts.debug) c_new=M.compress.whitespace(c_new);
							if( c_new ){
								if( sibling ){
									M.insertAfter(c_new,sibling);
								} else {
									el.appendChild(c_new);
								}
								c_last=c_new;
							}
						}
					}
				}
				
				if(comment){ // add a debug comment to element
					comment += ' >';
					comment = el.ownerDocument.createComment(comment);
					M.prependChild(el,comment);
				}
			}
			next && next(null, v);
		},
		function last(el,v,opts,next){
			try{
				next && next(null, v);
			}catch(e){
				var log = opts.log;
				if(log.error)log.error('if you get an exception here something strange is going on, check the call stack growth',e);
				throw e;
			}
		}
	],{
		apply:extend(function F( self, element, value, options, end){
			if( !element ){
				end && end(); return;
			}
			
			var data2dom=options.data2dom || [];
			if( !Array.isArray(data2dom) && typeof(data2dom) === 'function' ) data2dom = [data2dom]; // if just a single function
			data2dom = data2dom.concat(this); // note data2dom functions via options come first, and thus have higher priority
			
			for(var m=0,ml=data2dom.length;m<ml;m++){
				data2dom[m] = F.bind(data2dom[m], self, element, value, options);
			}
			
			async.waterfall(data2dom,end);
		},{
			bind:extend(function FF( mapper, self, element, value, options){
				var log = options.log || {};
				
				if(!mapper || typeof(mapper)!=='function'){
					log.error && log.error( 'invalid data2dom mapper, not a function and is ignored!',{data2dom:mapper});
					return FF.noop;
				}
				return function(v, next){
					if(!next && typeof(v) === 'function'){ next = v; v=void 0; } // first mapper in waterfall doesn't get v from previous one
					try{
						mapper.call( self, element, v || value, options, next );
					}catch(e){
						log.error && log.error('ignoring exeption in data2dom mapper',{data2dom:mapper,err:e});
						next && next( e );
					}
				};
			},{
				noop:function(v, next){ // dummy if mapper is invalid
					if(!next && typeof(v) === 'function'){ next=v; v=void 0; }
					next && next(null,v);
				}
			})
		})
	})
});
