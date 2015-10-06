[![Build Status](https://travis-ci.org/x-component/x-template.png?v0.0.2)](https://travis-ci.org/x-component/x-template)
=======================================================================================================



# x-template
============

This module offers simple *DOM* based templating by merging in *JSON* and/or *DOM* data sets using *css* selectors.

## Example: DOM Template + JSON Data
------------------------------------

Assume you have the following JSON data:

    var o = {
        users: [
            { person : { name: 'Joe'  , age: 20 , active:true,  address: { street: 's1' } } },
            { person : { name: 'Alice', age: 35 , active:false } },
            { person : { name: 'Bob'  , age: 40 , active:true  } }
        ]
    };

combined with the following template:

    <ul data-is=".users" >
        <li data-is=".person" >
            Name:<span data-is=".name">-</span><span data-if=".age">&nbsp;(<span data-is=".age"><span>)</span>
        </li>
    </ul>
    <span data-not=".users">No users available</span>

the result is:

    <ul>
        <li>
            Name:<span>Joe</span><span>&nbsp;(<span>20</span>)</span>
        </li>
        <li>
            Name:<span>Alice</span><span>&nbsp;(<span>35</span>)</span>
        </li>
        <li>
            Name:<span>Bob</span><span>&nbsp;(<span>40</span>)</span>
        </li>
    </ul>



## Example: DOM Template + DOM Data
-----------------------------------

 Assume you have the following part of an RSS feed:

 using the following template:

     <section data-is="channel"
       <h1 data-is=">title">TITLE</h1>
       <a data-to-href=">link" data-$txt=">description" ><pan data-is="$txt">description</span></a>
       <ul data-if="item">
         <li data-is="item"><a data-to-href="link" data-$txt="title" ><pan data-is="$txt">news</span></a></li>
       <ul>
     </section>

 the result is:

The basic templating function is thus as follows: DOM x DATA -> DOM, where DATA = JSON or DOM (HTML/XML)

Templating means here recursively walking top down and for each template DOM element

- *select* a subset from the provided data
- *linking* a new DOM element for each result in the selected data
- *merge* the result into the result DOM element (data2dom)


## Selecting Data
-----------------

We all know how to use *css* selectors to query a tree of dom elements to get a result *set* of *DOM* nodes.
Here we use a syntax like the css selector syntax to perfrom a query on a tree of *JSON* data and get a as a result a *set* of JSON objects

The syntax is described in [x-select](http://github.com/x-component/x-select)

## Linking DOM Element to Data with data- Attributes
----------------------------------------------------

A 'data-' attribute on a DOM element is used to define relation between a result DOM element and the selected data

- **data-if**               clone this element if there is data

- **data-not**              clone this element if there is no data

- **data-is**               clone this element for each data object in the result set, then
                            merge the data object into the element and
                            use that value as data for all sub template elements

- **data-to-'attribute'**   attribute is an attribute name where the result is rendered into. p.e. data-to-href

## Scope
--------
A DOM element is related to a result from a set found by a 'data-is'
selector. All selectors of sub elements are evaluated on this result data.
Therefore a DOM element with a data-is forms a implicit **data scope** for all subelements.

You can escape from that scope using :root or a variable (see below)

## Data2DOM
-----------

The real rendering is defined by an array of functions mapping a data object (JSON or DOM) into a DOM element

There are some predefined renderers, you can add your own ones by passing them
in the options.data2dom as array.

each renderer has the following interface:

     function(element, value, options, next){
         // element  is the dom element where the value should be rendered into
         //
         // value    is what can be rendered into the element.
         //          This can be string, but also an object, or a DOM element
         //
         // options  option passed through from the main template call, you can use it p.e. to pass a logger
         //
         // this     for JSON rendering this is the js-traverse context of the value.
         //          this.key for example returns the name of the key at which value was found in an object

         // **Here you can inspect the element and the value and maniupulate the dom tree**
         // be sure to call then next:

         // next      Use next(null,value) and pass the (changed) value to the next handler
         //           or call next(true,value). True indicates you handled the value and no further 
         //           data2dom handler is called.
         //
         //           The passed value is used by the next data2dom handler and data-is templating scope for sublements
     }

The following data2dom handlers are predefined:

date     if the *key* of the value contains Date or date the value is formated using the given html lang and put into the elements innerHTML
url      if the *key* of the value is url and the el has a  href, action, src attribute the url is rendered in that one.	
input    renders values for input fields:
         textarea: set value in innerHTML
         input, select, option, button set the attribute value (not for type checkbox)
img      set the src of the image
text     default replace the elements textContext with a value convertet to string, if it is not an object
dom2dom  This renders the value if the value is an dom element.
         As this can be quite complex you can pass a debug:true in the options, to get some extra comments in the result
         to see what happened.

         attribute handling
         -------------------
         Attribute values are copied: a simple set, the 'class' attribute is different: value are concatenated, seperated by blanks.
         The following attributes in the template element can define what should be copied/merged. Values are whitespace separated:
         'data-attributes'         which attributes can be copied,          * means all
         'data-attributes-exclude' which attributes should *not* be copied, * means all
         'data-class'              which classes should be added,           * means all
         'data-class-exclude'      which classes should *not* be added,     * means all

         Inner HTML
         'data-option'            if this contains 'inner' then the complete innerHTML is copied 1:1

         text node handling
         ------------------
         'data-exclude-texts'     Use true to indicate *not* to copy text nodes

         All text nodes from the target are replaced each by those of the source. Note that text nodes can
         occur multiple time inbetween the subelementes of the template element. Hence this rule.
         If the target has more text nodes then the source these are removed.
         If the source has more they are appended at to the last one.


## Apply / Recursion data-apply
-------------------------------
'data-apply' Is a template attribute containing a DOM css selecter of the template (not the data source!)
             which defines the next elements to be used as child elements of the current template element during templating.

This allows to use arbritray snippets of a page as templates and break up a single template in smaller parts.
More important it allows to template recursive structures of arbitray depth.
Example: A backend sends a tree with nodes like a->b->(c,d->(x,y,z))

data:

     { node: 'a', children:[
         { node:'a.1', children: [
             { node:'a.1.I' },
             { node:'a.1.II', children: [
                 { node: 'a.1.II.X'},
                 { node: 'a.1.II.Y'},
                 { node: 'a.1.II.Z'}
             ]}
         ]},
         { node: 'a.2', children: [
             { node: 'a.2.I'},
             { node: 'a.2.II'}
         ]}
]*       }

template:

    <div data-template="node-content">
        <span data-is="> .node"></span>
        <ul   data-if="> .children" >
            <li data-is="> .children" data-apply=":root [data-template='node-content']" ></li>
        </ul>
    </div>

result:

    <div data-template="node-content">
        <span>a</span>
        <ul>
            <li><div data-template="node-content">
                <span>a.1</span>
                <ul>
                    <li><div data-template="node-content"><span>a.1.I</span></div></li>
                    <li><div data-template="node-content"><span>a.1.II</span>
                        <ul>
                            <li><div data-template="node-content"><span>a.1.II.X</span></div></li>
                            <li><div data-template="node-content”><span>a.1.II.Y</span></div></li>
                            <li><div data-template="node-content"><span>a.1.II.Z</span></div></li>
                        </ul>
                    </div></li>
                </ul>
            </div></li>
            <li><div data-template="node-content">
                <span>a.2</span>
                <ul>
                    <li><div data-template="node-content"><span>a.2.I</span></div></li>
                    <li><div data-template="node-content"><span>a.2.II</span></div></li>
                </ul>
            </div></li>
        </ul>
     </div>

Note: The attribute name 'data-template' is just a convention, anything can be used by the data-apply selector.


## Variables 'data-$' (experimental)
------------------------------------
'data-$' Can be used to reuse a set of results within a scope and thus to simplifies the
         templates extracting otherwise repeated expressions.

The following example extracts all images from all paragraphs,
and then renders the paragraphs and appends a list of all images found in the paragraphs:

     <div data-$img="p img" ><!-- store the results set in $img for this scope -->
         <p data-is="p" data-option="inner"><p>
         <ul class="gallery" data-if="$img"><!-- use the set $img, check if it is empty -->
             <li data-is="$img ><!-- generate a li for each image -->
               <img class="thumbnail" data-option="self" data-is=">img" /><!-- use that image to render it here -->
             </li>
         </ul>
     <div>


Note: In fact the templating engine also uses a simple mnemonization within a scope.
Thus in a template with <ul data-if=".persons" ><li data-is=".persons" >...</li></ul>
the expresion .persons is evaluated just once. If the 'same' selector was already evaluated
in the same scope it is expected to be the same result set.
If a selector is the same as an other one, is for now simply checked by a string comparison.

Note: you can not (yet) use variable somewhere in a selector, they
only can replace a whole selector for now.

## Options: data-option
-----------------------
Options to influence templating behavior can be set in the template using 'data-option' the values are blank separated.

invisible  The element it self will be removed after templating the subnode are added to the parent.
           p.e. "Pack my box with<span data-options="invisible" data-is=".txt">five</span> dozen liquor jugs." 
           and {txt:'sixty five'}
           becomes "Pack my box with sixty five dozen liquor jugs.

self       Allows the selector to match the data forming the scope to be matched. It thus match itself. 

           Example: Normally one decents through the data as scopes level by level:

           <div data-is=".person">
              <span data-is=".name"></span>
              <span data-is=".age"></span>
           <div>

           and {person:{ name: 'John', age:20 }}. Each rendered div is associated a found person:{...} 
            the spans scope for the selector is that person. 

           The folloging however works only because of "self"
            <div data-is=".person"><p data-is=".name, .age" >
              <span data-option="self" data-is=".name"></span>
              <span data-option="self" data-is=".age"></span>
            </p><div>

           The scope of <p> selector is the object of person: {...}. The p is thus rendered twice.
           The scope of each span is then for first <p> the value 'John', and for the second <p> the value '20'.
           The option self allows the selector of the span to match the value again.


the following options are only used with dom2dom templating:

inner      The innerhtml of the src is copied 1:1 to the target

texts      All text nodes of the *source* will be wrapped in <span class="text">, this allows to walk through als text nodes combined with tags ( p.e. paragraphs)
           and keep the order of textnodes / elements as is. see example below:

Example for the option texts:

Imagine you have a paragraph with <br/> and *nested* spans

     <p class="fancy" >Lorem ipsum dolor sit amet,<br/>
        <a class="funny" href="/abcd" >consectetur adipiscing elit.
           <span>Vivamus pulvinar <span>lectus</br>
           in</span> felis dignissim,</span>
           nec <strong>vulputate <br/>diam <strong>lobortis</strong>.<br/>
           Cras nisl diam, faucibus eget<img src="/my-huge-image" />
       </a>
       vulputate vitae, lacinia eu lorem.
     <p>

 now we could either use 'inner', then the complete content is copied as is.

    <p data-option="inner" data-is="p" >

 or we parse recursively through the paragaph and replace some tags, p.e. the <br/> by a <span class="break"></span>
 and remove the image tags:

    <p data-option="self texts" data-is="> p" data-exclude-texts="true" >
        <!--
           NOTE: the option 'texts' causes that text nodes as children of p are wrapped in spans
           so the next > span.text  matches the text nodes.
           First we match all allowed elements in an invisible span, this way we preserve the order of all sub elements

        -->
        <span data-template="paragraph-content" data-option="invisible" data-is="> a, > br, > span, > strong, data-exclude-texts="true" data-exclude-attributes="*">
              <a      data-option="self"           data-is="> a" href="#" data-exclude-texts="true"         data-apply=":root [data-template='paragraph-content']" ></a>
              <span   data-option="self"           data-is="> br"  class="break"></span>
              <span   data-option="self"           data-is="> span[class!=text]"  data-exclude-texts="true" data-apply=":root [data-template='paragraph-content']" ></span>
              <span   data-option="self invisible" data-is="> span.text"                                    data-apply=":root [data-template='paragraph-content']" ></span>
              <strong data-option="self"           data-is="> strong"             data-exclude-texts="true" data-apply=":root [data-template='paragraph-content']" ></strong>
              <!-- artificial text spans are matched here, invisible removes them from the result -->
              <span   data-option="self invisible" data-is="> span.text"   data-apply=":root [data-template='paragraph-content']" ></span>
        </span>
    </p>

 The result is then:


## I miss a feature / rendering
-------------------------------
As you can see templating already offer a log of things.
If you are missing a feature think of the following options you have:

(1) Extend the list of data2dom handlers and pass an array of your own data2dom handlers in the template options

  p.e. a special renderer can load subsequent missing data from backends if they a requested by rendering.
  An other own render could format values before the are rendered.

  Note that within a data2dom handler you have full access to the element, you can thus add your own 'data-' attribute extensions or own possible 'data-option' contents

(2) Don't put to much logic the templates. Better is to prepare the data upfront so rendering becomes easier:

  For example instead of using the following complex expression in each template *everywhere* to check the data state
  to decide to render an edit link or not:

  <a href="/edit" data-if="((.user .rights .edit ) or (.user .roles:contains('admin') )) and (.user )" >Edit</a>

  prepare the data at a central place in code:

  if(data.user && (user.rights.edit || ~user.roles.indexOf('admin')) ) { data.edit = true }

  and use in the template just:

  <a href="/edit" data-if=".edit" >Edit</d>

 As soon as you think about templating templates, propably something is going wrong: Move it to code if possible.

 Still missing a feature? Have an awesome general data2dom handler? post an issue / submit a pull request!



# template(element, data, options, callback(err,element))
----------------------------------------------------
@param {} element the DOM element to use a template   
@param {} data the JSON object or DOM element to use as data input   
@param {} options.data2dom an array of data2dom handlers to user before the default onews   
@param {} callback.err err which occurs   
@param {} callback.element the new template element (normally the passed element to template is templated in place)   
