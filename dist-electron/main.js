import L from "node:fs/promises";
import B from "node:path";
import { fileURLToPath as qu } from "node:url";
import { ipcMain as J, BrowserWindow as ge, dialog as su, shell as ju, app as Ne } from "electron";
import Vu from "node:os";
import { execFile as zu } from "node:child_process";
import { promisify as $u } from "node:util";
import Ou from "node:fs";
const Gu = $u(zu);
async function Ye(t, a, i = {}) {
  await Gu(t, a, {
    maxBuffer: 1024 * 1024 * 20,
    ...i
  });
}
async function Hu(t) {
  return L.mkdtemp(B.join(Vu.tmpdir(), `${t}-`));
}
async function Iu(t, a) {
  const i = await Hu(a);
  return process.platform === "win32" ? await Ye("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${t.replace(/'/g, "''")}' -DestinationPath '${i.replace(/'/g, "''")}' -Force`
  ]) : await Ye("unzip", ["-qq", t, "-d", i]), i;
}
async function Xu(t, a) {
  const i = B.resolve(a);
  if (await L.mkdir(B.dirname(i), { recursive: !0 }), await L.rm(i, { force: !0 }), process.platform === "win32") {
    const o = `${i}.zip`;
    await L.rm(o, { force: !0 }), await Ye("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${B.join(t, "*").replace(/'/g, "''")}' -DestinationPath '${o.replace(/'/g, "''")}' -Force`
    ]), await L.rename(o, i);
    return;
  }
  await Ye("zip", ["-qr", i, "."], { cwd: t });
}
function Wu(t) {
  return t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
function Qu(t) {
  return [...t.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((i) => Wu(i[1])).map((i) => i.trim()).filter(Boolean);
}
async function _u(t) {
  var f;
  const a = await Iu(t, "profe-pptx"), i = B.join(a, "ppt", "slides"), o = (await L.readdir(i)).filter((d) => /^slide\d+\.xml$/.test(d)).sort((d, T) => {
    var F, q;
    const g = Number(((F = d.match(/slide(\d+)\.xml$/)) == null ? void 0 : F[1]) ?? 0), _ = Number(((q = T.match(/slide(\d+)\.xml$/)) == null ? void 0 : q[1]) ?? 0);
    return g - _;
  }), c = [];
  for (const d of o) {
    const T = await L.readFile(B.join(i, d), "utf8"), g = Qu(T);
    g.length > 0 && c.push({
      slide: Number(((f = d.match(/slide(\d+)\.xml$/)) == null ? void 0 : f[1]) ?? 0),
      text: g.join(" ")
    });
  }
  const D = c.map((d) => `Slide ${d.slide}: ${d.text}`).join(`
`);
  return {
    slides: c,
    fullText: D
  };
}
var Pe = {}, fe = {}, Ce = {}, wu;
function Ke() {
  if (wu) return Ce;
  wu = 1;
  function t(D, f, d) {
    if (d === void 0 && (d = Array.prototype), D && typeof d.find == "function")
      return d.find.call(D, f);
    for (var T = 0; T < D.length; T++)
      if (Object.prototype.hasOwnProperty.call(D, T)) {
        var g = D[T];
        if (f.call(void 0, g, T, D))
          return g;
      }
  }
  function a(D, f) {
    return f === void 0 && (f = Object), f && typeof f.freeze == "function" ? f.freeze(D) : D;
  }
  function i(D, f) {
    if (D === null || typeof D != "object")
      throw new TypeError("target is not an object");
    for (var d in f)
      Object.prototype.hasOwnProperty.call(f, d) && (D[d] = f[d]);
    return D;
  }
  var o = a({
    /**
     * `text/html`, the only mime type that triggers treating an XML document as HTML.
     *
     * @see DOMParser.SupportedType.isHTML
     * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/HTML Wikipedia
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
     * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
     */
    HTML: "text/html",
    /**
     * Helper method to check a mime type if it indicates an HTML document
     *
     * @param {string} [value]
     * @returns {boolean}
     *
     * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/HTML Wikipedia
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
     * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
    isHTML: function(D) {
      return D === o.HTML;
    },
    /**
     * `application/xml`, the standard mime type for XML documents.
     *
     * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
     * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
     * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
     */
    XML_APPLICATION: "application/xml",
    /**
     * `text/html`, an alias for `application/xml`.
     *
     * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
     * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
     */
    XML_TEXT: "text/xml",
    /**
     * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
     * but is parsed as an XML document.
     *
     * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
     * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
     */
    XML_XHTML_APPLICATION: "application/xhtml+xml",
    /**
     * `image/svg+xml`,
     *
     * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
     * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
     * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
     */
    XML_SVG_IMAGE: "image/svg+xml"
  }), c = a({
    /**
     * The XHTML namespace.
     *
     * @see http://www.w3.org/1999/xhtml
     */
    HTML: "http://www.w3.org/1999/xhtml",
    /**
     * Checks if `uri` equals `NAMESPACE.HTML`.
     *
     * @param {string} [uri]
     *
     * @see NAMESPACE.HTML
     */
    isHTML: function(D) {
      return D === c.HTML;
    },
    /**
     * The SVG namespace.
     *
     * @see http://www.w3.org/2000/svg
     */
    SVG: "http://www.w3.org/2000/svg",
    /**
     * The `xml:` namespace.
     *
     * @see http://www.w3.org/XML/1998/namespace
     */
    XML: "http://www.w3.org/XML/1998/namespace",
    /**
     * The `xmlns:` namespace
     *
     * @see https://www.w3.org/2000/xmlns/
     */
    XMLNS: "http://www.w3.org/2000/xmlns/"
  });
  return Ce.assign = i, Ce.find = t, Ce.freeze = a, Ce.MIME_TYPE = o, Ce.NAMESPACE = c, Ce;
}
var bu;
function Ru() {
  if (bu) return fe;
  bu = 1;
  var t = Ke(), a = t.find, i = t.NAMESPACE;
  function o(e) {
    return e !== "";
  }
  function c(e) {
    return e ? e.split(/[\t\n\f\r ]+/).filter(o) : [];
  }
  function D(e, u) {
    return e.hasOwnProperty(u) || (e[u] = !0), e;
  }
  function f(e) {
    if (!e) return [];
    var u = c(e);
    return Object.keys(u.reduce(D, {}));
  }
  function d(e) {
    return function(u) {
      return e && e.indexOf(u) !== -1;
    };
  }
  function T(e, u) {
    for (var r in e)
      Object.prototype.hasOwnProperty.call(e, r) && (u[r] = e[r]);
  }
  function g(e, u) {
    var r = e.prototype;
    if (!(r instanceof u)) {
      let n = function() {
      };
      n.prototype = u.prototype, n = new n(), T(r, n), e.prototype = r = n;
    }
    r.constructor != e && (typeof e != "function" && console.error("unknown Class:" + e), r.constructor = e);
  }
  var _ = {}, F = _.ELEMENT_NODE = 1, q = _.ATTRIBUTE_NODE = 2, X = _.TEXT_NODE = 3, le = _.CDATA_SECTION_NODE = 4, Z = _.ENTITY_REFERENCE_NODE = 5, m = _.ENTITY_NODE = 6, O = _.PROCESSING_INSTRUCTION_NODE = 7, R = _.COMMENT_NODE = 8, I = _.DOCUMENT_NODE = 9, $ = _.DOCUMENT_TYPE_NODE = 10, j = _.DOCUMENT_FRAGMENT_NODE = 11, ee = _.NOTATION_NODE = 12, S = {}, k = {};
  S.INDEX_SIZE_ERR = (k[1] = "Index size error", 1), S.DOMSTRING_SIZE_ERR = (k[2] = "DOMString size error", 2);
  var s = S.HIERARCHY_REQUEST_ERR = (k[3] = "Hierarchy request error", 3);
  S.WRONG_DOCUMENT_ERR = (k[4] = "Wrong document", 4), S.INVALID_CHARACTER_ERR = (k[5] = "Invalid character", 5), S.NO_DATA_ALLOWED_ERR = (k[6] = "No data allowed", 6), S.NO_MODIFICATION_ALLOWED_ERR = (k[7] = "No modification allowed", 7);
  var p = S.NOT_FOUND_ERR = (k[8] = "Not found", 8);
  S.NOT_SUPPORTED_ERR = (k[9] = "Not supported", 9);
  var A = S.INUSE_ATTRIBUTE_ERR = (k[10] = "Attribute in use", 10);
  S.INVALID_STATE_ERR = (k[11] = "Invalid state", 11), S.SYNTAX_ERR = (k[12] = "Syntax error", 12), S.INVALID_MODIFICATION_ERR = (k[13] = "Invalid modification", 13), S.NAMESPACE_ERR = (k[14] = "Invalid namespace", 14), S.INVALID_ACCESS_ERR = (k[15] = "Invalid access", 15);
  function h(e, u) {
    if (u instanceof Error)
      var r = u;
    else
      r = this, Error.call(this, k[e]), this.message = k[e], Error.captureStackTrace && Error.captureStackTrace(this, h);
    return r.code = e, u && (this.message = this.message + ": " + u), r;
  }
  h.prototype = Error.prototype, T(S, h);
  function E() {
  }
  E.prototype = {
    /**
     * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
     * @standard level1
     */
    length: 0,
    /**
     * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
     * @standard level1
     * @param index  unsigned long
     *   Index into the collection.
     * @return Node
     * 	The node at the indexth position in the NodeList, or null if that is not a valid index.
     */
    item: function(e) {
      return e >= 0 && e < this.length ? this[e] : null;
    },
    toString: function(e, u) {
      for (var r = [], n = 0; n < this.length; n++)
        Se(this[n], r, e, u);
      return r.join("");
    },
    /**
     * @private
     * @param {function (Node):boolean} predicate
     * @returns {Node[]}
     */
    filter: function(e) {
      return Array.prototype.filter.call(this, e);
    },
    /**
     * @private
     * @param {Node} item
     * @returns {number}
     */
    indexOf: function(e) {
      return Array.prototype.indexOf.call(this, e);
    }
  };
  function y(e, u) {
    this._node = e, this._refresh = u, x(this);
  }
  function x(e) {
    var u = e._node._inc || e._node.ownerDocument._inc;
    if (e._inc !== u) {
      var r = e._refresh(e._node);
      if (gu(e, "length", r.length), !e.$$length || r.length < e.$$length)
        for (var n = r.length; n in e; n++)
          Object.prototype.hasOwnProperty.call(e, n) && delete e[n];
      T(r, e), e._inc = u;
    }
  }
  y.prototype.item = function(e) {
    return x(this), this[e] || null;
  }, g(y, E);
  function P() {
  }
  function b(e, u) {
    for (var r = e.length; r--; )
      if (e[r] === u)
        return r;
  }
  function C(e, u, r, n) {
    if (n ? u[b(u, n)] = r : u[u.length++] = r, e) {
      r.ownerElement = e;
      var l = e.ownerDocument;
      l && (n && Ie(l, e, n), H(l, e, r));
    }
  }
  function N(e, u, r) {
    var n = b(u, r);
    if (n >= 0) {
      for (var l = u.length - 1; n < l; )
        u[n] = u[++n];
      if (u.length = l, e) {
        var w = e.ownerDocument;
        w && (Ie(w, e, r), r.ownerElement = null);
      }
    } else
      throw new h(p, new Error(e.tagName + "@" + r));
  }
  P.prototype = {
    length: 0,
    item: E.prototype.item,
    getNamedItem: function(e) {
      for (var u = this.length; u--; ) {
        var r = this[u];
        if (r.nodeName == e)
          return r;
      }
    },
    setNamedItem: function(e) {
      var u = e.ownerElement;
      if (u && u != this._ownerElement)
        throw new h(A);
      var r = this.getNamedItem(e.nodeName);
      return C(this._ownerElement, this, e, r), r;
    },
    /* returns Node */
    setNamedItemNS: function(e) {
      var u = e.ownerElement, r;
      if (u && u != this._ownerElement)
        throw new h(A);
      return r = this.getNamedItemNS(e.namespaceURI, e.localName), C(this._ownerElement, this, e, r), r;
    },
    /* returns Node */
    removeNamedItem: function(e) {
      var u = this.getNamedItem(e);
      return N(this._ownerElement, this, u), u;
    },
    // raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
    //for level2
    removeNamedItemNS: function(e, u) {
      var r = this.getNamedItemNS(e, u);
      return N(this._ownerElement, this, r), r;
    },
    getNamedItemNS: function(e, u) {
      for (var r = this.length; r--; ) {
        var n = this[r];
        if (n.localName == u && n.namespaceURI == e)
          return n;
      }
      return null;
    }
  };
  function V() {
  }
  V.prototype = {
    /**
     * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
     * The different implementations fairly diverged in what kind of features were reported.
     * The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
     *
     * @deprecated It is deprecated and modern browsers return true in all cases.
     *
     * @param {string} feature
     * @param {string} [version]
     * @returns {boolean} always true
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
     * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
     */
    hasFeature: function(e, u) {
      return !0;
    },
    /**
     * Creates an XML Document object of the specified type with its document element.
     *
     * __It behaves slightly different from the description in the living standard__:
     * - There is no interface/class `XMLDocument`, it returns a `Document` instance.
     * - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
     * - this implementation is not validating names or qualified names
     *   (when parsing XML strings, the SAX parser takes care of that)
     *
     * @param {string|null} namespaceURI
     * @param {string} qualifiedName
     * @param {DocumentType=null} doctype
     * @returns {Document}
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
     * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
     *
     * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
     * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
     * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
     */
    createDocument: function(e, u, r) {
      var n = new G();
      if (n.implementation = this, n.childNodes = new E(), n.doctype = r || null, r && n.appendChild(r), u) {
        var l = n.createElementNS(e, u);
        n.appendChild(l);
      }
      return n;
    },
    /**
     * Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
     *
     * __This behavior is slightly different from the in the specs__:
     * - this implementation is not validating names or qualified names
     *   (when parsing XML strings, the SAX parser takes care of that)
     *
     * @param {string} qualifiedName
     * @param {string} [publicId]
     * @param {string} [systemId]
     * @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
     * 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
     * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
     *
     * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
     * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
     * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
     */
    createDocumentType: function(e, u, r) {
      var n = new $e();
      return n.name = e, n.nodeName = e, n.publicId = u || "", n.systemId = r || "", n;
    }
  };
  function v() {
  }
  v.prototype = {
    firstChild: null,
    lastChild: null,
    previousSibling: null,
    nextSibling: null,
    attributes: null,
    parentNode: null,
    childNodes: null,
    ownerDocument: null,
    nodeValue: null,
    namespaceURI: null,
    prefix: null,
    localName: null,
    // Modified in DOM Level 2:
    insertBefore: function(e, u) {
      return De(this, e, u);
    },
    replaceChild: function(e, u) {
      De(this, e, u, ze), u && this.removeChild(u);
    },
    removeChild: function(e) {
      return K(this, e);
    },
    appendChild: function(e) {
      return this.insertBefore(e, null);
    },
    hasChildNodes: function() {
      return this.firstChild != null;
    },
    cloneNode: function(e) {
      return au(this.ownerDocument || this, this, e);
    },
    // Modified in DOM Level 2:
    normalize: function() {
      for (var e = this.firstChild; e; ) {
        var u = e.nextSibling;
        u && u.nodeType == X && e.nodeType == X ? (this.removeChild(u), e.appendData(u.data)) : (e.normalize(), e = u);
      }
    },
    // Introduced in DOM Level 2:
    isSupported: function(e, u) {
      return this.ownerDocument.implementation.hasFeature(e, u);
    },
    // Introduced in DOM Level 2:
    hasAttributes: function() {
      return this.attributes.length > 0;
    },
    /**
     * Look up the prefix associated to the given namespace URI, starting from this node.
     * **The default namespace declarations are ignored by this method.**
     * See Namespace Prefix Lookup for details on the algorithm used by this method.
     *
     * _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
     *
     * @param {string | null} namespaceURI
     * @returns {string | null}
     * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
     * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
     * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
     * @see https://github.com/xmldom/xmldom/issues/322
     */
    lookupPrefix: function(e) {
      for (var u = this; u; ) {
        var r = u._nsMap;
        if (r) {
          for (var n in r)
            if (Object.prototype.hasOwnProperty.call(r, n) && r[n] === e)
              return n;
        }
        u = u.nodeType == q ? u.ownerDocument : u.parentNode;
      }
      return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI: function(e) {
      for (var u = this; u; ) {
        var r = u._nsMap;
        if (r && Object.prototype.hasOwnProperty.call(r, e))
          return r[e];
        u = u.nodeType == q ? u.ownerDocument : u.parentNode;
      }
      return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace: function(e) {
      var u = this.lookupPrefix(e);
      return u == null;
    }
  };
  function ue(e) {
    return e == "<" && "&lt;" || e == ">" && "&gt;" || e == "&" && "&amp;" || e == '"' && "&quot;" || "&#" + e.charCodeAt() + ";";
  }
  T(_, v), T(_, v.prototype);
  function me(e, u) {
    if (u(e))
      return !0;
    if (e = e.firstChild)
      do
        if (me(e, u))
          return !0;
      while (e = e.nextSibling);
  }
  function G() {
    this.ownerDocument = this;
  }
  function H(e, u, r) {
    e && e._inc++;
    var n = r.namespaceURI;
    n === i.XMLNS && (u._nsMap[r.prefix ? r.localName : ""] = r.value);
  }
  function Ie(e, u, r, n) {
    e && e._inc++;
    var l = r.namespaceURI;
    l === i.XMLNS && delete u._nsMap[r.prefix ? r.localName : ""];
  }
  function ye(e, u, r) {
    if (e && e._inc) {
      e._inc++;
      var n = u.childNodes;
      if (r)
        n[n.length++] = r;
      else {
        for (var l = u.firstChild, w = 0; l; )
          n[w++] = l, l = l.nextSibling;
        n.length = w, delete n[n.length];
      }
    }
  }
  function K(e, u) {
    var r = u.previousSibling, n = u.nextSibling;
    return r ? r.nextSibling = n : e.firstChild = n, n ? n.previousSibling = r : e.lastChild = r, u.parentNode = null, u.previousSibling = null, u.nextSibling = null, ye(e.ownerDocument, e), u;
  }
  function ie(e) {
    return e && (e.nodeType === v.DOCUMENT_NODE || e.nodeType === v.DOCUMENT_FRAGMENT_NODE || e.nodeType === v.ELEMENT_NODE);
  }
  function _e(e) {
    return e && (ae(e) || Be(e) || te(e) || e.nodeType === v.DOCUMENT_FRAGMENT_NODE || e.nodeType === v.COMMENT_NODE || e.nodeType === v.PROCESSING_INSTRUCTION_NODE);
  }
  function te(e) {
    return e && e.nodeType === v.DOCUMENT_TYPE_NODE;
  }
  function ae(e) {
    return e && e.nodeType === v.ELEMENT_NODE;
  }
  function Be(e) {
    return e && e.nodeType === v.TEXT_NODE;
  }
  function Q(e, u) {
    var r = e.childNodes || [];
    if (a(r, ae) || te(u))
      return !1;
    var n = a(r, te);
    return !(u && n && r.indexOf(n) > r.indexOf(u));
  }
  function xe(e, u) {
    var r = e.childNodes || [];
    function n(w) {
      return ae(w) && w !== u;
    }
    if (a(r, n))
      return !1;
    var l = a(r, te);
    return !(u && l && r.indexOf(l) > r.indexOf(u));
  }
  function W(e, u, r) {
    if (!ie(e))
      throw new h(s, "Unexpected parent node type " + e.nodeType);
    if (r && r.parentNode !== e)
      throw new h(p, "child not in parent");
    if (
      // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
      !_e(u) || // 5. If either `node` is a Text node and `parent` is a document,
      // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
      // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
      // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
      te(u) && e.nodeType !== v.DOCUMENT_NODE
    )
      throw new h(
        s,
        "Unexpected node type " + u.nodeType + " for parent node type " + e.nodeType
      );
  }
  function Ve(e, u, r) {
    var n = e.childNodes || [], l = u.childNodes || [];
    if (u.nodeType === v.DOCUMENT_FRAGMENT_NODE) {
      var w = l.filter(ae);
      if (w.length > 1 || a(l, Be))
        throw new h(s, "More than one element or text in fragment");
      if (w.length === 1 && !Q(e, r))
        throw new h(s, "Element in fragment can not be inserted before doctype");
    }
    if (ae(u) && !Q(e, r))
      throw new h(s, "Only one element can be added and only after doctype");
    if (te(u)) {
      if (a(n, te))
        throw new h(s, "Only one doctype is allowed");
      var U = a(n, ae);
      if (r && n.indexOf(U) < n.indexOf(r))
        throw new h(s, "Doctype can only be inserted before an element");
      if (!r && U)
        throw new h(s, "Doctype can not be appended since element is present");
    }
  }
  function ze(e, u, r) {
    var n = e.childNodes || [], l = u.childNodes || [];
    if (u.nodeType === v.DOCUMENT_FRAGMENT_NODE) {
      var w = l.filter(ae);
      if (w.length > 1 || a(l, Be))
        throw new h(s, "More than one element or text in fragment");
      if (w.length === 1 && !xe(e, r))
        throw new h(s, "Element in fragment can not be inserted before doctype");
    }
    if (ae(u) && !xe(e, r))
      throw new h(s, "Only one element can be added and only after doctype");
    if (te(u)) {
      if (a(n, function(oe) {
        return te(oe) && oe !== r;
      }))
        throw new h(s, "Only one doctype is allowed");
      var U = a(n, ae);
      if (r && n.indexOf(U) < n.indexOf(r))
        throw new h(s, "Doctype can only be inserted before an element");
    }
  }
  function De(e, u, r, n) {
    W(e, u, r), e.nodeType === v.DOCUMENT_NODE && (n || Ve)(e, u, r);
    var l = u.parentNode;
    if (l && l.removeChild(u), u.nodeType === j) {
      var w = u.firstChild;
      if (w == null)
        return u;
      var U = u.lastChild;
    } else
      w = U = u;
    var re = r ? r.previousSibling : e.lastChild;
    w.previousSibling = re, U.nextSibling = r, re ? re.nextSibling = w : e.firstChild = w, r == null ? e.lastChild = U : r.previousSibling = U;
    do {
      w.parentNode = e;
      var oe = e.ownerDocument || e;
      he(w, oe);
    } while (w !== U && (w = w.nextSibling));
    return ye(e.ownerDocument || e, e), u.nodeType == j && (u.firstChild = u.lastChild = null), u;
  }
  function he(e, u) {
    if (e.ownerDocument !== u) {
      if (e.ownerDocument = u, e.nodeType === F && e.attributes)
        for (var r = 0; r < e.attributes.length; r++) {
          var n = e.attributes.item(r);
          n && (n.ownerDocument = u);
        }
      for (var l = e.firstChild; l; )
        he(l, u), l = l.nextSibling;
    }
  }
  function M(e, u) {
    u.parentNode && u.parentNode.removeChild(u), u.parentNode = e, u.previousSibling = e.lastChild, u.nextSibling = null, u.previousSibling ? u.previousSibling.nextSibling = u : e.firstChild = u, e.lastChild = u, ye(e.ownerDocument, e, u);
    var r = e.ownerDocument || e;
    return he(u, r), u;
  }
  G.prototype = {
    //implementation : null,
    nodeName: "#document",
    nodeType: I,
    /**
     * The DocumentType node of the document.
     *
     * @readonly
     * @type DocumentType
     */
    doctype: null,
    documentElement: null,
    _inc: 1,
    insertBefore: function(e, u) {
      if (e.nodeType == j) {
        for (var r = e.firstChild; r; ) {
          var n = r.nextSibling;
          this.insertBefore(r, u), r = n;
        }
        return e;
      }
      return De(this, e, u), he(e, this), this.documentElement === null && e.nodeType === F && (this.documentElement = e), e;
    },
    removeChild: function(e) {
      return this.documentElement == e && (this.documentElement = null), K(this, e);
    },
    replaceChild: function(e, u) {
      De(this, e, u, ze), he(e, this), u && this.removeChild(u), ae(e) && (this.documentElement = e);
    },
    // Introduced in DOM Level 2:
    importNode: function(e, u) {
      return Au(this, e, u);
    },
    // Introduced in DOM Level 2:
    getElementById: function(e) {
      var u = null;
      return me(this.documentElement, function(r) {
        if (r.nodeType == F && r.getAttribute("id") == e)
          return u = r, !0;
      }), u;
    },
    /**
     * The `getElementsByClassName` method of `Document` interface returns an array-like object
     * of all child elements which have **all** of the given class name(s).
     *
     * Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
     *
     *
     * Warning: This is a live LiveNodeList.
     * Changes in the DOM will reflect in the array as the changes occur.
     * If an element selected by this array no longer qualifies for the selector,
     * it will automatically be removed. Be aware of this for iteration purposes.
     *
     * @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
     * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
     */
    getElementsByClassName: function(e) {
      var u = f(e);
      return new y(this, function(r) {
        var n = [];
        return u.length > 0 && me(r.documentElement, function(l) {
          if (l !== r && l.nodeType === F) {
            var w = l.getAttribute("class");
            if (w) {
              var U = e === w;
              if (!U) {
                var re = f(w);
                U = u.every(d(re));
              }
              U && n.push(l);
            }
          }
        }), n;
      });
    },
    //document factory method:
    createElement: function(e) {
      var u = new z();
      u.ownerDocument = this, u.nodeName = e, u.tagName = e, u.localName = e, u.childNodes = new E();
      var r = u.attributes = new P();
      return r._ownerElement = u, u;
    },
    createDocumentFragment: function() {
      var e = new Ge();
      return e.ownerDocument = this, e.childNodes = new E(), e;
    },
    createTextNode: function(e) {
      var u = new Je();
      return u.ownerDocument = this, u.appendData(e), u;
    },
    createComment: function(e) {
      var u = new Ze();
      return u.ownerDocument = this, u.appendData(e), u;
    },
    createCDATASection: function(e) {
      var u = new eu();
      return u.ownerDocument = this, u.appendData(e), u;
    },
    createProcessingInstruction: function(e, u) {
      var r = new ru();
      return r.ownerDocument = this, r.tagName = r.nodeName = r.target = e, r.nodeValue = r.data = u, r;
    },
    createAttribute: function(e) {
      var u = new Fe();
      return u.ownerDocument = this, u.name = e, u.nodeName = e, u.localName = e, u.specified = !0, u;
    },
    createEntityReference: function(e) {
      var u = new uu();
      return u.ownerDocument = this, u.nodeName = e, u;
    },
    // Introduced in DOM Level 2:
    createElementNS: function(e, u) {
      var r = new z(), n = u.split(":"), l = r.attributes = new P();
      return r.childNodes = new E(), r.ownerDocument = this, r.nodeName = u, r.tagName = u, r.namespaceURI = e, n.length == 2 ? (r.prefix = n[0], r.localName = n[1]) : r.localName = u, l._ownerElement = r, r;
    },
    // Introduced in DOM Level 2:
    createAttributeNS: function(e, u) {
      var r = new Fe(), n = u.split(":");
      return r.ownerDocument = this, r.nodeName = u, r.name = u, r.namespaceURI = e, r.specified = !0, n.length == 2 ? (r.prefix = n[0], r.localName = n[1]) : r.localName = u, r;
    }
  }, g(G, v);
  function z() {
    this._nsMap = {};
  }
  z.prototype = {
    nodeType: F,
    hasAttribute: function(e) {
      return this.getAttributeNode(e) != null;
    },
    getAttribute: function(e) {
      var u = this.getAttributeNode(e);
      return u && u.value || "";
    },
    getAttributeNode: function(e) {
      return this.attributes.getNamedItem(e);
    },
    setAttribute: function(e, u) {
      var r = this.ownerDocument.createAttribute(e);
      r.value = r.nodeValue = "" + u, this.setAttributeNode(r);
    },
    removeAttribute: function(e) {
      var u = this.getAttributeNode(e);
      u && this.removeAttributeNode(u);
    },
    //four real opeartion method
    appendChild: function(e) {
      return e.nodeType === j ? this.insertBefore(e, null) : M(this, e);
    },
    setAttributeNode: function(e) {
      return this.attributes.setNamedItem(e);
    },
    setAttributeNodeNS: function(e) {
      return this.attributes.setNamedItemNS(e);
    },
    removeAttributeNode: function(e) {
      return this.attributes.removeNamedItem(e.nodeName);
    },
    //get real attribute name,and remove it by removeAttributeNode
    removeAttributeNS: function(e, u) {
      var r = this.getAttributeNodeNS(e, u);
      r && this.removeAttributeNode(r);
    },
    hasAttributeNS: function(e, u) {
      return this.getAttributeNodeNS(e, u) != null;
    },
    getAttributeNS: function(e, u) {
      var r = this.getAttributeNodeNS(e, u);
      return r && r.value || "";
    },
    setAttributeNS: function(e, u, r) {
      var n = this.ownerDocument.createAttributeNS(e, u);
      n.value = n.nodeValue = "" + r, this.setAttributeNode(n);
    },
    getAttributeNodeNS: function(e, u) {
      return this.attributes.getNamedItemNS(e, u);
    },
    getElementsByTagName: function(e) {
      return new y(this, function(u) {
        var r = [];
        return me(u, function(n) {
          n !== u && n.nodeType == F && (e === "*" || n.tagName == e) && r.push(n);
        }), r;
      });
    },
    getElementsByTagNameNS: function(e, u) {
      return new y(this, function(r) {
        var n = [];
        return me(r, function(l) {
          l !== r && l.nodeType === F && (e === "*" || l.namespaceURI === e) && (u === "*" || l.localName == u) && n.push(l);
        }), n;
      });
    }
  }, G.prototype.getElementsByTagName = z.prototype.getElementsByTagName, G.prototype.getElementsByTagNameNS = z.prototype.getElementsByTagNameNS, g(z, v);
  function Fe() {
  }
  Fe.prototype.nodeType = q, g(Fe, v);
  function Re() {
  }
  Re.prototype = {
    data: "",
    substringData: function(e, u) {
      return this.data.substring(e, e + u);
    },
    appendData: function(e) {
      e = this.data + e, this.nodeValue = this.data = e, this.length = e.length;
    },
    insertData: function(e, u) {
      this.replaceData(e, 0, u);
    },
    appendChild: function(e) {
      throw new Error(k[s]);
    },
    deleteData: function(e, u) {
      this.replaceData(e, u, "");
    },
    replaceData: function(e, u, r) {
      var n = this.data.substring(0, e), l = this.data.substring(e + u);
      r = n + r + l, this.nodeValue = this.data = r, this.length = r.length;
    }
  }, g(Re, v);
  function Je() {
  }
  Je.prototype = {
    nodeName: "#text",
    nodeType: X,
    splitText: function(e) {
      var u = this.data, r = u.substring(e);
      u = u.substring(0, e), this.data = this.nodeValue = u, this.length = u.length;
      var n = this.ownerDocument.createTextNode(r);
      return this.parentNode && this.parentNode.insertBefore(n, this.nextSibling), n;
    }
  }, g(Je, Re);
  function Ze() {
  }
  Ze.prototype = {
    nodeName: "#comment",
    nodeType: R
  }, g(Ze, Re);
  function eu() {
  }
  eu.prototype = {
    nodeName: "#cdata-section",
    nodeType: le
  }, g(eu, Re);
  function $e() {
  }
  $e.prototype.nodeType = $, g($e, v);
  function mu() {
  }
  mu.prototype.nodeType = ee, g(mu, v);
  function du() {
  }
  du.prototype.nodeType = m, g(du, v);
  function uu() {
  }
  uu.prototype.nodeType = Z, g(uu, v);
  function Ge() {
  }
  Ge.prototype.nodeName = "#document-fragment", Ge.prototype.nodeType = j, g(Ge, v);
  function ru() {
  }
  ru.prototype.nodeType = O, g(ru, v);
  function fu() {
  }
  fu.prototype.serializeToString = function(e, u, r) {
    return Du.call(e, u, r);
  }, v.prototype.toString = Du;
  function Du(e, u) {
    var r = [], n = this.nodeType == 9 && this.documentElement || this, l = n.prefix, w = n.namespaceURI;
    if (w && l == null) {
      var l = n.lookupPrefix(w);
      if (l == null)
        var U = [
          { namespace: w, prefix: null }
          //{namespace:uri,prefix:''}
        ];
    }
    return Se(this, r, e, u, U), r.join("");
  }
  function hu(e, u, r) {
    var n = e.prefix || "", l = e.namespaceURI;
    if (!l || n === "xml" && l === i.XML || l === i.XMLNS)
      return !1;
    for (var w = r.length; w--; ) {
      var U = r[w];
      if (U.prefix === n)
        return U.namespace !== l;
    }
    return !0;
  }
  function tu(e, u, r) {
    e.push(" ", u, '="', r.replace(/[<>&"\t\n\r]/g, ue), '"');
  }
  function Se(e, u, r, n, l) {
    if (l || (l = []), n)
      if (e = n(e), e) {
        if (typeof e == "string") {
          u.push(e);
          return;
        }
      } else
        return;
    switch (e.nodeType) {
      case F:
        var w = e.attributes, U = w.length, Y = e.firstChild, re = e.tagName;
        r = i.isHTML(e.namespaceURI) || r;
        var oe = re;
        if (!r && !e.prefix && e.namespaceURI) {
          for (var Ae, de = 0; de < w.length; de++)
            if (w.item(de).name === "xmlns") {
              Ae = w.item(de).value;
              break;
            }
          if (!Ae)
            for (var ve = l.length - 1; ve >= 0; ve--) {
              var Ee = l[ve];
              if (Ee.prefix === "" && Ee.namespace === e.namespaceURI) {
                Ae = Ee.namespace;
                break;
              }
            }
          if (Ae !== e.namespaceURI)
            for (var ve = l.length - 1; ve >= 0; ve--) {
              var Ee = l[ve];
              if (Ee.namespace === e.namespaceURI) {
                Ee.prefix && (oe = Ee.prefix + ":" + re);
                break;
              }
            }
        }
        u.push("<", oe);
        for (var we = 0; we < U; we++) {
          var ce = w.item(we);
          ce.prefix == "xmlns" ? l.push({ prefix: ce.localName, namespace: ce.value }) : ce.nodeName == "xmlns" && l.push({ prefix: "", namespace: ce.value });
        }
        for (var we = 0; we < U; we++) {
          var ce = w.item(we);
          if (hu(ce, r, l)) {
            var be = ce.prefix || "", Le = ce.namespaceURI;
            tu(u, be ? "xmlns:" + be : "xmlns", Le), l.push({ prefix: be, namespace: Le });
          }
          Se(ce, u, r, n, l);
        }
        if (re === oe && hu(e, r, l)) {
          var be = e.prefix || "", Le = e.namespaceURI;
          tu(u, be ? "xmlns:" + be : "xmlns", Le), l.push({ prefix: be, namespace: Le });
        }
        if (Y || r && !/^(?:meta|link|img|br|hr|input)$/i.test(re)) {
          if (u.push(">"), r && /^script$/i.test(re))
            for (; Y; )
              Y.data ? u.push(Y.data) : Se(Y, u, r, n, l.slice()), Y = Y.nextSibling;
          else
            for (; Y; )
              Se(Y, u, r, n, l.slice()), Y = Y.nextSibling;
          u.push("</", oe, ">");
        } else
          u.push("/>");
        return;
      case I:
      case j:
        for (var Y = e.firstChild; Y; )
          Se(Y, u, r, n, l.slice()), Y = Y.nextSibling;
        return;
      case q:
        return tu(u, e.name, e.value);
      case X:
        return u.push(
          e.data.replace(/[<&>]/g, ue)
        );
      case le:
        return u.push("<![CDATA[", e.data, "]]>");
      case R:
        return u.push("<!--", e.data, "-->");
      case $:
        var vu = e.publicId, qe = e.systemId;
        if (u.push("<!DOCTYPE ", e.name), vu)
          u.push(" PUBLIC ", vu), qe && qe != "." && u.push(" ", qe), u.push(">");
        else if (qe && qe != ".")
          u.push(" SYSTEM ", qe, ">");
        else {
          var Eu = e.internalSubset;
          Eu && u.push(" [", Eu, "]"), u.push(">");
        }
        return;
      case O:
        return u.push("<?", e.target, " ", e.data, "?>");
      case Z:
        return u.push("&", e.nodeName, ";");
      //case ENTITY_NODE:
      //case NOTATION_NODE:
      default:
        u.push("??", e.nodeName);
    }
  }
  function Au(e, u, r) {
    var n;
    switch (u.nodeType) {
      case F:
        n = u.cloneNode(!1), n.ownerDocument = e;
      //var attrs = node2.attributes;
      //var len = attrs.length;
      //for(var i=0;i<len;i++){
      //node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
      //}
      case j:
        break;
      case q:
        r = !0;
        break;
    }
    if (n || (n = u.cloneNode(!1)), n.ownerDocument = e, n.parentNode = null, r)
      for (var l = u.firstChild; l; )
        n.appendChild(Au(e, l, r)), l = l.nextSibling;
    return n;
  }
  function au(e, u, r) {
    var n = new u.constructor();
    for (var l in u)
      if (Object.prototype.hasOwnProperty.call(u, l)) {
        var w = u[l];
        typeof w != "object" && w != n[l] && (n[l] = w);
      }
    switch (u.childNodes && (n.childNodes = new E()), n.ownerDocument = e, n.nodeType) {
      case F:
        var U = u.attributes, re = n.attributes = new P(), oe = U.length;
        re._ownerElement = n;
        for (var Ae = 0; Ae < oe; Ae++)
          n.setAttributeNode(au(e, U.item(Ae), !0));
        break;
      case q:
        r = !0;
    }
    if (r)
      for (var de = u.firstChild; de; )
        n.appendChild(au(e, de, r)), de = de.nextSibling;
    return n;
  }
  function gu(e, u, r) {
    e[u] = r;
  }
  try {
    if (Object.defineProperty) {
      let e = function(u) {
        switch (u.nodeType) {
          case F:
          case j:
            var r = [];
            for (u = u.firstChild; u; )
              u.nodeType !== 7 && u.nodeType !== 8 && r.push(e(u)), u = u.nextSibling;
            return r.join("");
          default:
            return u.nodeValue;
        }
      };
      Object.defineProperty(y.prototype, "length", {
        get: function() {
          return x(this), this.$$length;
        }
      }), Object.defineProperty(v.prototype, "textContent", {
        get: function() {
          return e(this);
        },
        set: function(u) {
          switch (this.nodeType) {
            case F:
            case j:
              for (; this.firstChild; )
                this.removeChild(this.firstChild);
              (u || String(u)) && this.appendChild(this.ownerDocument.createTextNode(u));
              break;
            default:
              this.data = u, this.value = u, this.nodeValue = u;
          }
        }
      }), gu = function(u, r, n) {
        u["$$" + r] = n;
      };
    }
  } catch {
  }
  return fe.DocumentType = $e, fe.DOMException = h, fe.DOMImplementation = V, fe.Element = z, fe.Node = v, fe.NodeList = E, fe.XMLSerializer = fu, fe;
}
var ke = {}, nu = {}, Cu;
function Yu() {
  return Cu || (Cu = 1, (function(t) {
    var a = Ke().freeze;
    t.XML_ENTITIES = a({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    }), t.HTML_ENTITIES = a({
      Aacute: "Á",
      aacute: "á",
      Abreve: "Ă",
      abreve: "ă",
      ac: "∾",
      acd: "∿",
      acE: "∾̳",
      Acirc: "Â",
      acirc: "â",
      acute: "´",
      Acy: "А",
      acy: "а",
      AElig: "Æ",
      aelig: "æ",
      af: "⁡",
      Afr: "𝔄",
      afr: "𝔞",
      Agrave: "À",
      agrave: "à",
      alefsym: "ℵ",
      aleph: "ℵ",
      Alpha: "Α",
      alpha: "α",
      Amacr: "Ā",
      amacr: "ā",
      amalg: "⨿",
      AMP: "&",
      amp: "&",
      And: "⩓",
      and: "∧",
      andand: "⩕",
      andd: "⩜",
      andslope: "⩘",
      andv: "⩚",
      ang: "∠",
      ange: "⦤",
      angle: "∠",
      angmsd: "∡",
      angmsdaa: "⦨",
      angmsdab: "⦩",
      angmsdac: "⦪",
      angmsdad: "⦫",
      angmsdae: "⦬",
      angmsdaf: "⦭",
      angmsdag: "⦮",
      angmsdah: "⦯",
      angrt: "∟",
      angrtvb: "⊾",
      angrtvbd: "⦝",
      angsph: "∢",
      angst: "Å",
      angzarr: "⍼",
      Aogon: "Ą",
      aogon: "ą",
      Aopf: "𝔸",
      aopf: "𝕒",
      ap: "≈",
      apacir: "⩯",
      apE: "⩰",
      ape: "≊",
      apid: "≋",
      apos: "'",
      ApplyFunction: "⁡",
      approx: "≈",
      approxeq: "≊",
      Aring: "Å",
      aring: "å",
      Ascr: "𝒜",
      ascr: "𝒶",
      Assign: "≔",
      ast: "*",
      asymp: "≈",
      asympeq: "≍",
      Atilde: "Ã",
      atilde: "ã",
      Auml: "Ä",
      auml: "ä",
      awconint: "∳",
      awint: "⨑",
      backcong: "≌",
      backepsilon: "϶",
      backprime: "‵",
      backsim: "∽",
      backsimeq: "⋍",
      Backslash: "∖",
      Barv: "⫧",
      barvee: "⊽",
      Barwed: "⌆",
      barwed: "⌅",
      barwedge: "⌅",
      bbrk: "⎵",
      bbrktbrk: "⎶",
      bcong: "≌",
      Bcy: "Б",
      bcy: "б",
      bdquo: "„",
      becaus: "∵",
      Because: "∵",
      because: "∵",
      bemptyv: "⦰",
      bepsi: "϶",
      bernou: "ℬ",
      Bernoullis: "ℬ",
      Beta: "Β",
      beta: "β",
      beth: "ℶ",
      between: "≬",
      Bfr: "𝔅",
      bfr: "𝔟",
      bigcap: "⋂",
      bigcirc: "◯",
      bigcup: "⋃",
      bigodot: "⨀",
      bigoplus: "⨁",
      bigotimes: "⨂",
      bigsqcup: "⨆",
      bigstar: "★",
      bigtriangledown: "▽",
      bigtriangleup: "△",
      biguplus: "⨄",
      bigvee: "⋁",
      bigwedge: "⋀",
      bkarow: "⤍",
      blacklozenge: "⧫",
      blacksquare: "▪",
      blacktriangle: "▴",
      blacktriangledown: "▾",
      blacktriangleleft: "◂",
      blacktriangleright: "▸",
      blank: "␣",
      blk12: "▒",
      blk14: "░",
      blk34: "▓",
      block: "█",
      bne: "=⃥",
      bnequiv: "≡⃥",
      bNot: "⫭",
      bnot: "⌐",
      Bopf: "𝔹",
      bopf: "𝕓",
      bot: "⊥",
      bottom: "⊥",
      bowtie: "⋈",
      boxbox: "⧉",
      boxDL: "╗",
      boxDl: "╖",
      boxdL: "╕",
      boxdl: "┐",
      boxDR: "╔",
      boxDr: "╓",
      boxdR: "╒",
      boxdr: "┌",
      boxH: "═",
      boxh: "─",
      boxHD: "╦",
      boxHd: "╤",
      boxhD: "╥",
      boxhd: "┬",
      boxHU: "╩",
      boxHu: "╧",
      boxhU: "╨",
      boxhu: "┴",
      boxminus: "⊟",
      boxplus: "⊞",
      boxtimes: "⊠",
      boxUL: "╝",
      boxUl: "╜",
      boxuL: "╛",
      boxul: "┘",
      boxUR: "╚",
      boxUr: "╙",
      boxuR: "╘",
      boxur: "└",
      boxV: "║",
      boxv: "│",
      boxVH: "╬",
      boxVh: "╫",
      boxvH: "╪",
      boxvh: "┼",
      boxVL: "╣",
      boxVl: "╢",
      boxvL: "╡",
      boxvl: "┤",
      boxVR: "╠",
      boxVr: "╟",
      boxvR: "╞",
      boxvr: "├",
      bprime: "‵",
      Breve: "˘",
      breve: "˘",
      brvbar: "¦",
      Bscr: "ℬ",
      bscr: "𝒷",
      bsemi: "⁏",
      bsim: "∽",
      bsime: "⋍",
      bsol: "\\",
      bsolb: "⧅",
      bsolhsub: "⟈",
      bull: "•",
      bullet: "•",
      bump: "≎",
      bumpE: "⪮",
      bumpe: "≏",
      Bumpeq: "≎",
      bumpeq: "≏",
      Cacute: "Ć",
      cacute: "ć",
      Cap: "⋒",
      cap: "∩",
      capand: "⩄",
      capbrcup: "⩉",
      capcap: "⩋",
      capcup: "⩇",
      capdot: "⩀",
      CapitalDifferentialD: "ⅅ",
      caps: "∩︀",
      caret: "⁁",
      caron: "ˇ",
      Cayleys: "ℭ",
      ccaps: "⩍",
      Ccaron: "Č",
      ccaron: "č",
      Ccedil: "Ç",
      ccedil: "ç",
      Ccirc: "Ĉ",
      ccirc: "ĉ",
      Cconint: "∰",
      ccups: "⩌",
      ccupssm: "⩐",
      Cdot: "Ċ",
      cdot: "ċ",
      cedil: "¸",
      Cedilla: "¸",
      cemptyv: "⦲",
      cent: "¢",
      CenterDot: "·",
      centerdot: "·",
      Cfr: "ℭ",
      cfr: "𝔠",
      CHcy: "Ч",
      chcy: "ч",
      check: "✓",
      checkmark: "✓",
      Chi: "Χ",
      chi: "χ",
      cir: "○",
      circ: "ˆ",
      circeq: "≗",
      circlearrowleft: "↺",
      circlearrowright: "↻",
      circledast: "⊛",
      circledcirc: "⊚",
      circleddash: "⊝",
      CircleDot: "⊙",
      circledR: "®",
      circledS: "Ⓢ",
      CircleMinus: "⊖",
      CirclePlus: "⊕",
      CircleTimes: "⊗",
      cirE: "⧃",
      cire: "≗",
      cirfnint: "⨐",
      cirmid: "⫯",
      cirscir: "⧂",
      ClockwiseContourIntegral: "∲",
      CloseCurlyDoubleQuote: "”",
      CloseCurlyQuote: "’",
      clubs: "♣",
      clubsuit: "♣",
      Colon: "∷",
      colon: ":",
      Colone: "⩴",
      colone: "≔",
      coloneq: "≔",
      comma: ",",
      commat: "@",
      comp: "∁",
      compfn: "∘",
      complement: "∁",
      complexes: "ℂ",
      cong: "≅",
      congdot: "⩭",
      Congruent: "≡",
      Conint: "∯",
      conint: "∮",
      ContourIntegral: "∮",
      Copf: "ℂ",
      copf: "𝕔",
      coprod: "∐",
      Coproduct: "∐",
      COPY: "©",
      copy: "©",
      copysr: "℗",
      CounterClockwiseContourIntegral: "∳",
      crarr: "↵",
      Cross: "⨯",
      cross: "✗",
      Cscr: "𝒞",
      cscr: "𝒸",
      csub: "⫏",
      csube: "⫑",
      csup: "⫐",
      csupe: "⫒",
      ctdot: "⋯",
      cudarrl: "⤸",
      cudarrr: "⤵",
      cuepr: "⋞",
      cuesc: "⋟",
      cularr: "↶",
      cularrp: "⤽",
      Cup: "⋓",
      cup: "∪",
      cupbrcap: "⩈",
      CupCap: "≍",
      cupcap: "⩆",
      cupcup: "⩊",
      cupdot: "⊍",
      cupor: "⩅",
      cups: "∪︀",
      curarr: "↷",
      curarrm: "⤼",
      curlyeqprec: "⋞",
      curlyeqsucc: "⋟",
      curlyvee: "⋎",
      curlywedge: "⋏",
      curren: "¤",
      curvearrowleft: "↶",
      curvearrowright: "↷",
      cuvee: "⋎",
      cuwed: "⋏",
      cwconint: "∲",
      cwint: "∱",
      cylcty: "⌭",
      Dagger: "‡",
      dagger: "†",
      daleth: "ℸ",
      Darr: "↡",
      dArr: "⇓",
      darr: "↓",
      dash: "‐",
      Dashv: "⫤",
      dashv: "⊣",
      dbkarow: "⤏",
      dblac: "˝",
      Dcaron: "Ď",
      dcaron: "ď",
      Dcy: "Д",
      dcy: "д",
      DD: "ⅅ",
      dd: "ⅆ",
      ddagger: "‡",
      ddarr: "⇊",
      DDotrahd: "⤑",
      ddotseq: "⩷",
      deg: "°",
      Del: "∇",
      Delta: "Δ",
      delta: "δ",
      demptyv: "⦱",
      dfisht: "⥿",
      Dfr: "𝔇",
      dfr: "𝔡",
      dHar: "⥥",
      dharl: "⇃",
      dharr: "⇂",
      DiacriticalAcute: "´",
      DiacriticalDot: "˙",
      DiacriticalDoubleAcute: "˝",
      DiacriticalGrave: "`",
      DiacriticalTilde: "˜",
      diam: "⋄",
      Diamond: "⋄",
      diamond: "⋄",
      diamondsuit: "♦",
      diams: "♦",
      die: "¨",
      DifferentialD: "ⅆ",
      digamma: "ϝ",
      disin: "⋲",
      div: "÷",
      divide: "÷",
      divideontimes: "⋇",
      divonx: "⋇",
      DJcy: "Ђ",
      djcy: "ђ",
      dlcorn: "⌞",
      dlcrop: "⌍",
      dollar: "$",
      Dopf: "𝔻",
      dopf: "𝕕",
      Dot: "¨",
      dot: "˙",
      DotDot: "⃜",
      doteq: "≐",
      doteqdot: "≑",
      DotEqual: "≐",
      dotminus: "∸",
      dotplus: "∔",
      dotsquare: "⊡",
      doublebarwedge: "⌆",
      DoubleContourIntegral: "∯",
      DoubleDot: "¨",
      DoubleDownArrow: "⇓",
      DoubleLeftArrow: "⇐",
      DoubleLeftRightArrow: "⇔",
      DoubleLeftTee: "⫤",
      DoubleLongLeftArrow: "⟸",
      DoubleLongLeftRightArrow: "⟺",
      DoubleLongRightArrow: "⟹",
      DoubleRightArrow: "⇒",
      DoubleRightTee: "⊨",
      DoubleUpArrow: "⇑",
      DoubleUpDownArrow: "⇕",
      DoubleVerticalBar: "∥",
      DownArrow: "↓",
      Downarrow: "⇓",
      downarrow: "↓",
      DownArrowBar: "⤓",
      DownArrowUpArrow: "⇵",
      DownBreve: "̑",
      downdownarrows: "⇊",
      downharpoonleft: "⇃",
      downharpoonright: "⇂",
      DownLeftRightVector: "⥐",
      DownLeftTeeVector: "⥞",
      DownLeftVector: "↽",
      DownLeftVectorBar: "⥖",
      DownRightTeeVector: "⥟",
      DownRightVector: "⇁",
      DownRightVectorBar: "⥗",
      DownTee: "⊤",
      DownTeeArrow: "↧",
      drbkarow: "⤐",
      drcorn: "⌟",
      drcrop: "⌌",
      Dscr: "𝒟",
      dscr: "𝒹",
      DScy: "Ѕ",
      dscy: "ѕ",
      dsol: "⧶",
      Dstrok: "Đ",
      dstrok: "đ",
      dtdot: "⋱",
      dtri: "▿",
      dtrif: "▾",
      duarr: "⇵",
      duhar: "⥯",
      dwangle: "⦦",
      DZcy: "Џ",
      dzcy: "џ",
      dzigrarr: "⟿",
      Eacute: "É",
      eacute: "é",
      easter: "⩮",
      Ecaron: "Ě",
      ecaron: "ě",
      ecir: "≖",
      Ecirc: "Ê",
      ecirc: "ê",
      ecolon: "≕",
      Ecy: "Э",
      ecy: "э",
      eDDot: "⩷",
      Edot: "Ė",
      eDot: "≑",
      edot: "ė",
      ee: "ⅇ",
      efDot: "≒",
      Efr: "𝔈",
      efr: "𝔢",
      eg: "⪚",
      Egrave: "È",
      egrave: "è",
      egs: "⪖",
      egsdot: "⪘",
      el: "⪙",
      Element: "∈",
      elinters: "⏧",
      ell: "ℓ",
      els: "⪕",
      elsdot: "⪗",
      Emacr: "Ē",
      emacr: "ē",
      empty: "∅",
      emptyset: "∅",
      EmptySmallSquare: "◻",
      emptyv: "∅",
      EmptyVerySmallSquare: "▫",
      emsp: " ",
      emsp13: " ",
      emsp14: " ",
      ENG: "Ŋ",
      eng: "ŋ",
      ensp: " ",
      Eogon: "Ę",
      eogon: "ę",
      Eopf: "𝔼",
      eopf: "𝕖",
      epar: "⋕",
      eparsl: "⧣",
      eplus: "⩱",
      epsi: "ε",
      Epsilon: "Ε",
      epsilon: "ε",
      epsiv: "ϵ",
      eqcirc: "≖",
      eqcolon: "≕",
      eqsim: "≂",
      eqslantgtr: "⪖",
      eqslantless: "⪕",
      Equal: "⩵",
      equals: "=",
      EqualTilde: "≂",
      equest: "≟",
      Equilibrium: "⇌",
      equiv: "≡",
      equivDD: "⩸",
      eqvparsl: "⧥",
      erarr: "⥱",
      erDot: "≓",
      Escr: "ℰ",
      escr: "ℯ",
      esdot: "≐",
      Esim: "⩳",
      esim: "≂",
      Eta: "Η",
      eta: "η",
      ETH: "Ð",
      eth: "ð",
      Euml: "Ë",
      euml: "ë",
      euro: "€",
      excl: "!",
      exist: "∃",
      Exists: "∃",
      expectation: "ℰ",
      ExponentialE: "ⅇ",
      exponentiale: "ⅇ",
      fallingdotseq: "≒",
      Fcy: "Ф",
      fcy: "ф",
      female: "♀",
      ffilig: "ﬃ",
      fflig: "ﬀ",
      ffllig: "ﬄ",
      Ffr: "𝔉",
      ffr: "𝔣",
      filig: "ﬁ",
      FilledSmallSquare: "◼",
      FilledVerySmallSquare: "▪",
      fjlig: "fj",
      flat: "♭",
      fllig: "ﬂ",
      fltns: "▱",
      fnof: "ƒ",
      Fopf: "𝔽",
      fopf: "𝕗",
      ForAll: "∀",
      forall: "∀",
      fork: "⋔",
      forkv: "⫙",
      Fouriertrf: "ℱ",
      fpartint: "⨍",
      frac12: "½",
      frac13: "⅓",
      frac14: "¼",
      frac15: "⅕",
      frac16: "⅙",
      frac18: "⅛",
      frac23: "⅔",
      frac25: "⅖",
      frac34: "¾",
      frac35: "⅗",
      frac38: "⅜",
      frac45: "⅘",
      frac56: "⅚",
      frac58: "⅝",
      frac78: "⅞",
      frasl: "⁄",
      frown: "⌢",
      Fscr: "ℱ",
      fscr: "𝒻",
      gacute: "ǵ",
      Gamma: "Γ",
      gamma: "γ",
      Gammad: "Ϝ",
      gammad: "ϝ",
      gap: "⪆",
      Gbreve: "Ğ",
      gbreve: "ğ",
      Gcedil: "Ģ",
      Gcirc: "Ĝ",
      gcirc: "ĝ",
      Gcy: "Г",
      gcy: "г",
      Gdot: "Ġ",
      gdot: "ġ",
      gE: "≧",
      ge: "≥",
      gEl: "⪌",
      gel: "⋛",
      geq: "≥",
      geqq: "≧",
      geqslant: "⩾",
      ges: "⩾",
      gescc: "⪩",
      gesdot: "⪀",
      gesdoto: "⪂",
      gesdotol: "⪄",
      gesl: "⋛︀",
      gesles: "⪔",
      Gfr: "𝔊",
      gfr: "𝔤",
      Gg: "⋙",
      gg: "≫",
      ggg: "⋙",
      gimel: "ℷ",
      GJcy: "Ѓ",
      gjcy: "ѓ",
      gl: "≷",
      gla: "⪥",
      glE: "⪒",
      glj: "⪤",
      gnap: "⪊",
      gnapprox: "⪊",
      gnE: "≩",
      gne: "⪈",
      gneq: "⪈",
      gneqq: "≩",
      gnsim: "⋧",
      Gopf: "𝔾",
      gopf: "𝕘",
      grave: "`",
      GreaterEqual: "≥",
      GreaterEqualLess: "⋛",
      GreaterFullEqual: "≧",
      GreaterGreater: "⪢",
      GreaterLess: "≷",
      GreaterSlantEqual: "⩾",
      GreaterTilde: "≳",
      Gscr: "𝒢",
      gscr: "ℊ",
      gsim: "≳",
      gsime: "⪎",
      gsiml: "⪐",
      Gt: "≫",
      GT: ">",
      gt: ">",
      gtcc: "⪧",
      gtcir: "⩺",
      gtdot: "⋗",
      gtlPar: "⦕",
      gtquest: "⩼",
      gtrapprox: "⪆",
      gtrarr: "⥸",
      gtrdot: "⋗",
      gtreqless: "⋛",
      gtreqqless: "⪌",
      gtrless: "≷",
      gtrsim: "≳",
      gvertneqq: "≩︀",
      gvnE: "≩︀",
      Hacek: "ˇ",
      hairsp: " ",
      half: "½",
      hamilt: "ℋ",
      HARDcy: "Ъ",
      hardcy: "ъ",
      hArr: "⇔",
      harr: "↔",
      harrcir: "⥈",
      harrw: "↭",
      Hat: "^",
      hbar: "ℏ",
      Hcirc: "Ĥ",
      hcirc: "ĥ",
      hearts: "♥",
      heartsuit: "♥",
      hellip: "…",
      hercon: "⊹",
      Hfr: "ℌ",
      hfr: "𝔥",
      HilbertSpace: "ℋ",
      hksearow: "⤥",
      hkswarow: "⤦",
      hoarr: "⇿",
      homtht: "∻",
      hookleftarrow: "↩",
      hookrightarrow: "↪",
      Hopf: "ℍ",
      hopf: "𝕙",
      horbar: "―",
      HorizontalLine: "─",
      Hscr: "ℋ",
      hscr: "𝒽",
      hslash: "ℏ",
      Hstrok: "Ħ",
      hstrok: "ħ",
      HumpDownHump: "≎",
      HumpEqual: "≏",
      hybull: "⁃",
      hyphen: "‐",
      Iacute: "Í",
      iacute: "í",
      ic: "⁣",
      Icirc: "Î",
      icirc: "î",
      Icy: "И",
      icy: "и",
      Idot: "İ",
      IEcy: "Е",
      iecy: "е",
      iexcl: "¡",
      iff: "⇔",
      Ifr: "ℑ",
      ifr: "𝔦",
      Igrave: "Ì",
      igrave: "ì",
      ii: "ⅈ",
      iiiint: "⨌",
      iiint: "∭",
      iinfin: "⧜",
      iiota: "℩",
      IJlig: "Ĳ",
      ijlig: "ĳ",
      Im: "ℑ",
      Imacr: "Ī",
      imacr: "ī",
      image: "ℑ",
      ImaginaryI: "ⅈ",
      imagline: "ℐ",
      imagpart: "ℑ",
      imath: "ı",
      imof: "⊷",
      imped: "Ƶ",
      Implies: "⇒",
      in: "∈",
      incare: "℅",
      infin: "∞",
      infintie: "⧝",
      inodot: "ı",
      Int: "∬",
      int: "∫",
      intcal: "⊺",
      integers: "ℤ",
      Integral: "∫",
      intercal: "⊺",
      Intersection: "⋂",
      intlarhk: "⨗",
      intprod: "⨼",
      InvisibleComma: "⁣",
      InvisibleTimes: "⁢",
      IOcy: "Ё",
      iocy: "ё",
      Iogon: "Į",
      iogon: "į",
      Iopf: "𝕀",
      iopf: "𝕚",
      Iota: "Ι",
      iota: "ι",
      iprod: "⨼",
      iquest: "¿",
      Iscr: "ℐ",
      iscr: "𝒾",
      isin: "∈",
      isindot: "⋵",
      isinE: "⋹",
      isins: "⋴",
      isinsv: "⋳",
      isinv: "∈",
      it: "⁢",
      Itilde: "Ĩ",
      itilde: "ĩ",
      Iukcy: "І",
      iukcy: "і",
      Iuml: "Ï",
      iuml: "ï",
      Jcirc: "Ĵ",
      jcirc: "ĵ",
      Jcy: "Й",
      jcy: "й",
      Jfr: "𝔍",
      jfr: "𝔧",
      jmath: "ȷ",
      Jopf: "𝕁",
      jopf: "𝕛",
      Jscr: "𝒥",
      jscr: "𝒿",
      Jsercy: "Ј",
      jsercy: "ј",
      Jukcy: "Є",
      jukcy: "є",
      Kappa: "Κ",
      kappa: "κ",
      kappav: "ϰ",
      Kcedil: "Ķ",
      kcedil: "ķ",
      Kcy: "К",
      kcy: "к",
      Kfr: "𝔎",
      kfr: "𝔨",
      kgreen: "ĸ",
      KHcy: "Х",
      khcy: "х",
      KJcy: "Ќ",
      kjcy: "ќ",
      Kopf: "𝕂",
      kopf: "𝕜",
      Kscr: "𝒦",
      kscr: "𝓀",
      lAarr: "⇚",
      Lacute: "Ĺ",
      lacute: "ĺ",
      laemptyv: "⦴",
      lagran: "ℒ",
      Lambda: "Λ",
      lambda: "λ",
      Lang: "⟪",
      lang: "⟨",
      langd: "⦑",
      langle: "⟨",
      lap: "⪅",
      Laplacetrf: "ℒ",
      laquo: "«",
      Larr: "↞",
      lArr: "⇐",
      larr: "←",
      larrb: "⇤",
      larrbfs: "⤟",
      larrfs: "⤝",
      larrhk: "↩",
      larrlp: "↫",
      larrpl: "⤹",
      larrsim: "⥳",
      larrtl: "↢",
      lat: "⪫",
      lAtail: "⤛",
      latail: "⤙",
      late: "⪭",
      lates: "⪭︀",
      lBarr: "⤎",
      lbarr: "⤌",
      lbbrk: "❲",
      lbrace: "{",
      lbrack: "[",
      lbrke: "⦋",
      lbrksld: "⦏",
      lbrkslu: "⦍",
      Lcaron: "Ľ",
      lcaron: "ľ",
      Lcedil: "Ļ",
      lcedil: "ļ",
      lceil: "⌈",
      lcub: "{",
      Lcy: "Л",
      lcy: "л",
      ldca: "⤶",
      ldquo: "“",
      ldquor: "„",
      ldrdhar: "⥧",
      ldrushar: "⥋",
      ldsh: "↲",
      lE: "≦",
      le: "≤",
      LeftAngleBracket: "⟨",
      LeftArrow: "←",
      Leftarrow: "⇐",
      leftarrow: "←",
      LeftArrowBar: "⇤",
      LeftArrowRightArrow: "⇆",
      leftarrowtail: "↢",
      LeftCeiling: "⌈",
      LeftDoubleBracket: "⟦",
      LeftDownTeeVector: "⥡",
      LeftDownVector: "⇃",
      LeftDownVectorBar: "⥙",
      LeftFloor: "⌊",
      leftharpoondown: "↽",
      leftharpoonup: "↼",
      leftleftarrows: "⇇",
      LeftRightArrow: "↔",
      Leftrightarrow: "⇔",
      leftrightarrow: "↔",
      leftrightarrows: "⇆",
      leftrightharpoons: "⇋",
      leftrightsquigarrow: "↭",
      LeftRightVector: "⥎",
      LeftTee: "⊣",
      LeftTeeArrow: "↤",
      LeftTeeVector: "⥚",
      leftthreetimes: "⋋",
      LeftTriangle: "⊲",
      LeftTriangleBar: "⧏",
      LeftTriangleEqual: "⊴",
      LeftUpDownVector: "⥑",
      LeftUpTeeVector: "⥠",
      LeftUpVector: "↿",
      LeftUpVectorBar: "⥘",
      LeftVector: "↼",
      LeftVectorBar: "⥒",
      lEg: "⪋",
      leg: "⋚",
      leq: "≤",
      leqq: "≦",
      leqslant: "⩽",
      les: "⩽",
      lescc: "⪨",
      lesdot: "⩿",
      lesdoto: "⪁",
      lesdotor: "⪃",
      lesg: "⋚︀",
      lesges: "⪓",
      lessapprox: "⪅",
      lessdot: "⋖",
      lesseqgtr: "⋚",
      lesseqqgtr: "⪋",
      LessEqualGreater: "⋚",
      LessFullEqual: "≦",
      LessGreater: "≶",
      lessgtr: "≶",
      LessLess: "⪡",
      lesssim: "≲",
      LessSlantEqual: "⩽",
      LessTilde: "≲",
      lfisht: "⥼",
      lfloor: "⌊",
      Lfr: "𝔏",
      lfr: "𝔩",
      lg: "≶",
      lgE: "⪑",
      lHar: "⥢",
      lhard: "↽",
      lharu: "↼",
      lharul: "⥪",
      lhblk: "▄",
      LJcy: "Љ",
      ljcy: "љ",
      Ll: "⋘",
      ll: "≪",
      llarr: "⇇",
      llcorner: "⌞",
      Lleftarrow: "⇚",
      llhard: "⥫",
      lltri: "◺",
      Lmidot: "Ŀ",
      lmidot: "ŀ",
      lmoust: "⎰",
      lmoustache: "⎰",
      lnap: "⪉",
      lnapprox: "⪉",
      lnE: "≨",
      lne: "⪇",
      lneq: "⪇",
      lneqq: "≨",
      lnsim: "⋦",
      loang: "⟬",
      loarr: "⇽",
      lobrk: "⟦",
      LongLeftArrow: "⟵",
      Longleftarrow: "⟸",
      longleftarrow: "⟵",
      LongLeftRightArrow: "⟷",
      Longleftrightarrow: "⟺",
      longleftrightarrow: "⟷",
      longmapsto: "⟼",
      LongRightArrow: "⟶",
      Longrightarrow: "⟹",
      longrightarrow: "⟶",
      looparrowleft: "↫",
      looparrowright: "↬",
      lopar: "⦅",
      Lopf: "𝕃",
      lopf: "𝕝",
      loplus: "⨭",
      lotimes: "⨴",
      lowast: "∗",
      lowbar: "_",
      LowerLeftArrow: "↙",
      LowerRightArrow: "↘",
      loz: "◊",
      lozenge: "◊",
      lozf: "⧫",
      lpar: "(",
      lparlt: "⦓",
      lrarr: "⇆",
      lrcorner: "⌟",
      lrhar: "⇋",
      lrhard: "⥭",
      lrm: "‎",
      lrtri: "⊿",
      lsaquo: "‹",
      Lscr: "ℒ",
      lscr: "𝓁",
      Lsh: "↰",
      lsh: "↰",
      lsim: "≲",
      lsime: "⪍",
      lsimg: "⪏",
      lsqb: "[",
      lsquo: "‘",
      lsquor: "‚",
      Lstrok: "Ł",
      lstrok: "ł",
      Lt: "≪",
      LT: "<",
      lt: "<",
      ltcc: "⪦",
      ltcir: "⩹",
      ltdot: "⋖",
      lthree: "⋋",
      ltimes: "⋉",
      ltlarr: "⥶",
      ltquest: "⩻",
      ltri: "◃",
      ltrie: "⊴",
      ltrif: "◂",
      ltrPar: "⦖",
      lurdshar: "⥊",
      luruhar: "⥦",
      lvertneqq: "≨︀",
      lvnE: "≨︀",
      macr: "¯",
      male: "♂",
      malt: "✠",
      maltese: "✠",
      Map: "⤅",
      map: "↦",
      mapsto: "↦",
      mapstodown: "↧",
      mapstoleft: "↤",
      mapstoup: "↥",
      marker: "▮",
      mcomma: "⨩",
      Mcy: "М",
      mcy: "м",
      mdash: "—",
      mDDot: "∺",
      measuredangle: "∡",
      MediumSpace: " ",
      Mellintrf: "ℳ",
      Mfr: "𝔐",
      mfr: "𝔪",
      mho: "℧",
      micro: "µ",
      mid: "∣",
      midast: "*",
      midcir: "⫰",
      middot: "·",
      minus: "−",
      minusb: "⊟",
      minusd: "∸",
      minusdu: "⨪",
      MinusPlus: "∓",
      mlcp: "⫛",
      mldr: "…",
      mnplus: "∓",
      models: "⊧",
      Mopf: "𝕄",
      mopf: "𝕞",
      mp: "∓",
      Mscr: "ℳ",
      mscr: "𝓂",
      mstpos: "∾",
      Mu: "Μ",
      mu: "μ",
      multimap: "⊸",
      mumap: "⊸",
      nabla: "∇",
      Nacute: "Ń",
      nacute: "ń",
      nang: "∠⃒",
      nap: "≉",
      napE: "⩰̸",
      napid: "≋̸",
      napos: "ŉ",
      napprox: "≉",
      natur: "♮",
      natural: "♮",
      naturals: "ℕ",
      nbsp: " ",
      nbump: "≎̸",
      nbumpe: "≏̸",
      ncap: "⩃",
      Ncaron: "Ň",
      ncaron: "ň",
      Ncedil: "Ņ",
      ncedil: "ņ",
      ncong: "≇",
      ncongdot: "⩭̸",
      ncup: "⩂",
      Ncy: "Н",
      ncy: "н",
      ndash: "–",
      ne: "≠",
      nearhk: "⤤",
      neArr: "⇗",
      nearr: "↗",
      nearrow: "↗",
      nedot: "≐̸",
      NegativeMediumSpace: "​",
      NegativeThickSpace: "​",
      NegativeThinSpace: "​",
      NegativeVeryThinSpace: "​",
      nequiv: "≢",
      nesear: "⤨",
      nesim: "≂̸",
      NestedGreaterGreater: "≫",
      NestedLessLess: "≪",
      NewLine: `
`,
      nexist: "∄",
      nexists: "∄",
      Nfr: "𝔑",
      nfr: "𝔫",
      ngE: "≧̸",
      nge: "≱",
      ngeq: "≱",
      ngeqq: "≧̸",
      ngeqslant: "⩾̸",
      nges: "⩾̸",
      nGg: "⋙̸",
      ngsim: "≵",
      nGt: "≫⃒",
      ngt: "≯",
      ngtr: "≯",
      nGtv: "≫̸",
      nhArr: "⇎",
      nharr: "↮",
      nhpar: "⫲",
      ni: "∋",
      nis: "⋼",
      nisd: "⋺",
      niv: "∋",
      NJcy: "Њ",
      njcy: "њ",
      nlArr: "⇍",
      nlarr: "↚",
      nldr: "‥",
      nlE: "≦̸",
      nle: "≰",
      nLeftarrow: "⇍",
      nleftarrow: "↚",
      nLeftrightarrow: "⇎",
      nleftrightarrow: "↮",
      nleq: "≰",
      nleqq: "≦̸",
      nleqslant: "⩽̸",
      nles: "⩽̸",
      nless: "≮",
      nLl: "⋘̸",
      nlsim: "≴",
      nLt: "≪⃒",
      nlt: "≮",
      nltri: "⋪",
      nltrie: "⋬",
      nLtv: "≪̸",
      nmid: "∤",
      NoBreak: "⁠",
      NonBreakingSpace: " ",
      Nopf: "ℕ",
      nopf: "𝕟",
      Not: "⫬",
      not: "¬",
      NotCongruent: "≢",
      NotCupCap: "≭",
      NotDoubleVerticalBar: "∦",
      NotElement: "∉",
      NotEqual: "≠",
      NotEqualTilde: "≂̸",
      NotExists: "∄",
      NotGreater: "≯",
      NotGreaterEqual: "≱",
      NotGreaterFullEqual: "≧̸",
      NotGreaterGreater: "≫̸",
      NotGreaterLess: "≹",
      NotGreaterSlantEqual: "⩾̸",
      NotGreaterTilde: "≵",
      NotHumpDownHump: "≎̸",
      NotHumpEqual: "≏̸",
      notin: "∉",
      notindot: "⋵̸",
      notinE: "⋹̸",
      notinva: "∉",
      notinvb: "⋷",
      notinvc: "⋶",
      NotLeftTriangle: "⋪",
      NotLeftTriangleBar: "⧏̸",
      NotLeftTriangleEqual: "⋬",
      NotLess: "≮",
      NotLessEqual: "≰",
      NotLessGreater: "≸",
      NotLessLess: "≪̸",
      NotLessSlantEqual: "⩽̸",
      NotLessTilde: "≴",
      NotNestedGreaterGreater: "⪢̸",
      NotNestedLessLess: "⪡̸",
      notni: "∌",
      notniva: "∌",
      notnivb: "⋾",
      notnivc: "⋽",
      NotPrecedes: "⊀",
      NotPrecedesEqual: "⪯̸",
      NotPrecedesSlantEqual: "⋠",
      NotReverseElement: "∌",
      NotRightTriangle: "⋫",
      NotRightTriangleBar: "⧐̸",
      NotRightTriangleEqual: "⋭",
      NotSquareSubset: "⊏̸",
      NotSquareSubsetEqual: "⋢",
      NotSquareSuperset: "⊐̸",
      NotSquareSupersetEqual: "⋣",
      NotSubset: "⊂⃒",
      NotSubsetEqual: "⊈",
      NotSucceeds: "⊁",
      NotSucceedsEqual: "⪰̸",
      NotSucceedsSlantEqual: "⋡",
      NotSucceedsTilde: "≿̸",
      NotSuperset: "⊃⃒",
      NotSupersetEqual: "⊉",
      NotTilde: "≁",
      NotTildeEqual: "≄",
      NotTildeFullEqual: "≇",
      NotTildeTilde: "≉",
      NotVerticalBar: "∤",
      npar: "∦",
      nparallel: "∦",
      nparsl: "⫽⃥",
      npart: "∂̸",
      npolint: "⨔",
      npr: "⊀",
      nprcue: "⋠",
      npre: "⪯̸",
      nprec: "⊀",
      npreceq: "⪯̸",
      nrArr: "⇏",
      nrarr: "↛",
      nrarrc: "⤳̸",
      nrarrw: "↝̸",
      nRightarrow: "⇏",
      nrightarrow: "↛",
      nrtri: "⋫",
      nrtrie: "⋭",
      nsc: "⊁",
      nsccue: "⋡",
      nsce: "⪰̸",
      Nscr: "𝒩",
      nscr: "𝓃",
      nshortmid: "∤",
      nshortparallel: "∦",
      nsim: "≁",
      nsime: "≄",
      nsimeq: "≄",
      nsmid: "∤",
      nspar: "∦",
      nsqsube: "⋢",
      nsqsupe: "⋣",
      nsub: "⊄",
      nsubE: "⫅̸",
      nsube: "⊈",
      nsubset: "⊂⃒",
      nsubseteq: "⊈",
      nsubseteqq: "⫅̸",
      nsucc: "⊁",
      nsucceq: "⪰̸",
      nsup: "⊅",
      nsupE: "⫆̸",
      nsupe: "⊉",
      nsupset: "⊃⃒",
      nsupseteq: "⊉",
      nsupseteqq: "⫆̸",
      ntgl: "≹",
      Ntilde: "Ñ",
      ntilde: "ñ",
      ntlg: "≸",
      ntriangleleft: "⋪",
      ntrianglelefteq: "⋬",
      ntriangleright: "⋫",
      ntrianglerighteq: "⋭",
      Nu: "Ν",
      nu: "ν",
      num: "#",
      numero: "№",
      numsp: " ",
      nvap: "≍⃒",
      nVDash: "⊯",
      nVdash: "⊮",
      nvDash: "⊭",
      nvdash: "⊬",
      nvge: "≥⃒",
      nvgt: ">⃒",
      nvHarr: "⤄",
      nvinfin: "⧞",
      nvlArr: "⤂",
      nvle: "≤⃒",
      nvlt: "<⃒",
      nvltrie: "⊴⃒",
      nvrArr: "⤃",
      nvrtrie: "⊵⃒",
      nvsim: "∼⃒",
      nwarhk: "⤣",
      nwArr: "⇖",
      nwarr: "↖",
      nwarrow: "↖",
      nwnear: "⤧",
      Oacute: "Ó",
      oacute: "ó",
      oast: "⊛",
      ocir: "⊚",
      Ocirc: "Ô",
      ocirc: "ô",
      Ocy: "О",
      ocy: "о",
      odash: "⊝",
      Odblac: "Ő",
      odblac: "ő",
      odiv: "⨸",
      odot: "⊙",
      odsold: "⦼",
      OElig: "Œ",
      oelig: "œ",
      ofcir: "⦿",
      Ofr: "𝔒",
      ofr: "𝔬",
      ogon: "˛",
      Ograve: "Ò",
      ograve: "ò",
      ogt: "⧁",
      ohbar: "⦵",
      ohm: "Ω",
      oint: "∮",
      olarr: "↺",
      olcir: "⦾",
      olcross: "⦻",
      oline: "‾",
      olt: "⧀",
      Omacr: "Ō",
      omacr: "ō",
      Omega: "Ω",
      omega: "ω",
      Omicron: "Ο",
      omicron: "ο",
      omid: "⦶",
      ominus: "⊖",
      Oopf: "𝕆",
      oopf: "𝕠",
      opar: "⦷",
      OpenCurlyDoubleQuote: "“",
      OpenCurlyQuote: "‘",
      operp: "⦹",
      oplus: "⊕",
      Or: "⩔",
      or: "∨",
      orarr: "↻",
      ord: "⩝",
      order: "ℴ",
      orderof: "ℴ",
      ordf: "ª",
      ordm: "º",
      origof: "⊶",
      oror: "⩖",
      orslope: "⩗",
      orv: "⩛",
      oS: "Ⓢ",
      Oscr: "𝒪",
      oscr: "ℴ",
      Oslash: "Ø",
      oslash: "ø",
      osol: "⊘",
      Otilde: "Õ",
      otilde: "õ",
      Otimes: "⨷",
      otimes: "⊗",
      otimesas: "⨶",
      Ouml: "Ö",
      ouml: "ö",
      ovbar: "⌽",
      OverBar: "‾",
      OverBrace: "⏞",
      OverBracket: "⎴",
      OverParenthesis: "⏜",
      par: "∥",
      para: "¶",
      parallel: "∥",
      parsim: "⫳",
      parsl: "⫽",
      part: "∂",
      PartialD: "∂",
      Pcy: "П",
      pcy: "п",
      percnt: "%",
      period: ".",
      permil: "‰",
      perp: "⊥",
      pertenk: "‱",
      Pfr: "𝔓",
      pfr: "𝔭",
      Phi: "Φ",
      phi: "φ",
      phiv: "ϕ",
      phmmat: "ℳ",
      phone: "☎",
      Pi: "Π",
      pi: "π",
      pitchfork: "⋔",
      piv: "ϖ",
      planck: "ℏ",
      planckh: "ℎ",
      plankv: "ℏ",
      plus: "+",
      plusacir: "⨣",
      plusb: "⊞",
      pluscir: "⨢",
      plusdo: "∔",
      plusdu: "⨥",
      pluse: "⩲",
      PlusMinus: "±",
      plusmn: "±",
      plussim: "⨦",
      plustwo: "⨧",
      pm: "±",
      Poincareplane: "ℌ",
      pointint: "⨕",
      Popf: "ℙ",
      popf: "𝕡",
      pound: "£",
      Pr: "⪻",
      pr: "≺",
      prap: "⪷",
      prcue: "≼",
      prE: "⪳",
      pre: "⪯",
      prec: "≺",
      precapprox: "⪷",
      preccurlyeq: "≼",
      Precedes: "≺",
      PrecedesEqual: "⪯",
      PrecedesSlantEqual: "≼",
      PrecedesTilde: "≾",
      preceq: "⪯",
      precnapprox: "⪹",
      precneqq: "⪵",
      precnsim: "⋨",
      precsim: "≾",
      Prime: "″",
      prime: "′",
      primes: "ℙ",
      prnap: "⪹",
      prnE: "⪵",
      prnsim: "⋨",
      prod: "∏",
      Product: "∏",
      profalar: "⌮",
      profline: "⌒",
      profsurf: "⌓",
      prop: "∝",
      Proportion: "∷",
      Proportional: "∝",
      propto: "∝",
      prsim: "≾",
      prurel: "⊰",
      Pscr: "𝒫",
      pscr: "𝓅",
      Psi: "Ψ",
      psi: "ψ",
      puncsp: " ",
      Qfr: "𝔔",
      qfr: "𝔮",
      qint: "⨌",
      Qopf: "ℚ",
      qopf: "𝕢",
      qprime: "⁗",
      Qscr: "𝒬",
      qscr: "𝓆",
      quaternions: "ℍ",
      quatint: "⨖",
      quest: "?",
      questeq: "≟",
      QUOT: '"',
      quot: '"',
      rAarr: "⇛",
      race: "∽̱",
      Racute: "Ŕ",
      racute: "ŕ",
      radic: "√",
      raemptyv: "⦳",
      Rang: "⟫",
      rang: "⟩",
      rangd: "⦒",
      range: "⦥",
      rangle: "⟩",
      raquo: "»",
      Rarr: "↠",
      rArr: "⇒",
      rarr: "→",
      rarrap: "⥵",
      rarrb: "⇥",
      rarrbfs: "⤠",
      rarrc: "⤳",
      rarrfs: "⤞",
      rarrhk: "↪",
      rarrlp: "↬",
      rarrpl: "⥅",
      rarrsim: "⥴",
      Rarrtl: "⤖",
      rarrtl: "↣",
      rarrw: "↝",
      rAtail: "⤜",
      ratail: "⤚",
      ratio: "∶",
      rationals: "ℚ",
      RBarr: "⤐",
      rBarr: "⤏",
      rbarr: "⤍",
      rbbrk: "❳",
      rbrace: "}",
      rbrack: "]",
      rbrke: "⦌",
      rbrksld: "⦎",
      rbrkslu: "⦐",
      Rcaron: "Ř",
      rcaron: "ř",
      Rcedil: "Ŗ",
      rcedil: "ŗ",
      rceil: "⌉",
      rcub: "}",
      Rcy: "Р",
      rcy: "р",
      rdca: "⤷",
      rdldhar: "⥩",
      rdquo: "”",
      rdquor: "”",
      rdsh: "↳",
      Re: "ℜ",
      real: "ℜ",
      realine: "ℛ",
      realpart: "ℜ",
      reals: "ℝ",
      rect: "▭",
      REG: "®",
      reg: "®",
      ReverseElement: "∋",
      ReverseEquilibrium: "⇋",
      ReverseUpEquilibrium: "⥯",
      rfisht: "⥽",
      rfloor: "⌋",
      Rfr: "ℜ",
      rfr: "𝔯",
      rHar: "⥤",
      rhard: "⇁",
      rharu: "⇀",
      rharul: "⥬",
      Rho: "Ρ",
      rho: "ρ",
      rhov: "ϱ",
      RightAngleBracket: "⟩",
      RightArrow: "→",
      Rightarrow: "⇒",
      rightarrow: "→",
      RightArrowBar: "⇥",
      RightArrowLeftArrow: "⇄",
      rightarrowtail: "↣",
      RightCeiling: "⌉",
      RightDoubleBracket: "⟧",
      RightDownTeeVector: "⥝",
      RightDownVector: "⇂",
      RightDownVectorBar: "⥕",
      RightFloor: "⌋",
      rightharpoondown: "⇁",
      rightharpoonup: "⇀",
      rightleftarrows: "⇄",
      rightleftharpoons: "⇌",
      rightrightarrows: "⇉",
      rightsquigarrow: "↝",
      RightTee: "⊢",
      RightTeeArrow: "↦",
      RightTeeVector: "⥛",
      rightthreetimes: "⋌",
      RightTriangle: "⊳",
      RightTriangleBar: "⧐",
      RightTriangleEqual: "⊵",
      RightUpDownVector: "⥏",
      RightUpTeeVector: "⥜",
      RightUpVector: "↾",
      RightUpVectorBar: "⥔",
      RightVector: "⇀",
      RightVectorBar: "⥓",
      ring: "˚",
      risingdotseq: "≓",
      rlarr: "⇄",
      rlhar: "⇌",
      rlm: "‏",
      rmoust: "⎱",
      rmoustache: "⎱",
      rnmid: "⫮",
      roang: "⟭",
      roarr: "⇾",
      robrk: "⟧",
      ropar: "⦆",
      Ropf: "ℝ",
      ropf: "𝕣",
      roplus: "⨮",
      rotimes: "⨵",
      RoundImplies: "⥰",
      rpar: ")",
      rpargt: "⦔",
      rppolint: "⨒",
      rrarr: "⇉",
      Rrightarrow: "⇛",
      rsaquo: "›",
      Rscr: "ℛ",
      rscr: "𝓇",
      Rsh: "↱",
      rsh: "↱",
      rsqb: "]",
      rsquo: "’",
      rsquor: "’",
      rthree: "⋌",
      rtimes: "⋊",
      rtri: "▹",
      rtrie: "⊵",
      rtrif: "▸",
      rtriltri: "⧎",
      RuleDelayed: "⧴",
      ruluhar: "⥨",
      rx: "℞",
      Sacute: "Ś",
      sacute: "ś",
      sbquo: "‚",
      Sc: "⪼",
      sc: "≻",
      scap: "⪸",
      Scaron: "Š",
      scaron: "š",
      sccue: "≽",
      scE: "⪴",
      sce: "⪰",
      Scedil: "Ş",
      scedil: "ş",
      Scirc: "Ŝ",
      scirc: "ŝ",
      scnap: "⪺",
      scnE: "⪶",
      scnsim: "⋩",
      scpolint: "⨓",
      scsim: "≿",
      Scy: "С",
      scy: "с",
      sdot: "⋅",
      sdotb: "⊡",
      sdote: "⩦",
      searhk: "⤥",
      seArr: "⇘",
      searr: "↘",
      searrow: "↘",
      sect: "§",
      semi: ";",
      seswar: "⤩",
      setminus: "∖",
      setmn: "∖",
      sext: "✶",
      Sfr: "𝔖",
      sfr: "𝔰",
      sfrown: "⌢",
      sharp: "♯",
      SHCHcy: "Щ",
      shchcy: "щ",
      SHcy: "Ш",
      shcy: "ш",
      ShortDownArrow: "↓",
      ShortLeftArrow: "←",
      shortmid: "∣",
      shortparallel: "∥",
      ShortRightArrow: "→",
      ShortUpArrow: "↑",
      shy: "­",
      Sigma: "Σ",
      sigma: "σ",
      sigmaf: "ς",
      sigmav: "ς",
      sim: "∼",
      simdot: "⩪",
      sime: "≃",
      simeq: "≃",
      simg: "⪞",
      simgE: "⪠",
      siml: "⪝",
      simlE: "⪟",
      simne: "≆",
      simplus: "⨤",
      simrarr: "⥲",
      slarr: "←",
      SmallCircle: "∘",
      smallsetminus: "∖",
      smashp: "⨳",
      smeparsl: "⧤",
      smid: "∣",
      smile: "⌣",
      smt: "⪪",
      smte: "⪬",
      smtes: "⪬︀",
      SOFTcy: "Ь",
      softcy: "ь",
      sol: "/",
      solb: "⧄",
      solbar: "⌿",
      Sopf: "𝕊",
      sopf: "𝕤",
      spades: "♠",
      spadesuit: "♠",
      spar: "∥",
      sqcap: "⊓",
      sqcaps: "⊓︀",
      sqcup: "⊔",
      sqcups: "⊔︀",
      Sqrt: "√",
      sqsub: "⊏",
      sqsube: "⊑",
      sqsubset: "⊏",
      sqsubseteq: "⊑",
      sqsup: "⊐",
      sqsupe: "⊒",
      sqsupset: "⊐",
      sqsupseteq: "⊒",
      squ: "□",
      Square: "□",
      square: "□",
      SquareIntersection: "⊓",
      SquareSubset: "⊏",
      SquareSubsetEqual: "⊑",
      SquareSuperset: "⊐",
      SquareSupersetEqual: "⊒",
      SquareUnion: "⊔",
      squarf: "▪",
      squf: "▪",
      srarr: "→",
      Sscr: "𝒮",
      sscr: "𝓈",
      ssetmn: "∖",
      ssmile: "⌣",
      sstarf: "⋆",
      Star: "⋆",
      star: "☆",
      starf: "★",
      straightepsilon: "ϵ",
      straightphi: "ϕ",
      strns: "¯",
      Sub: "⋐",
      sub: "⊂",
      subdot: "⪽",
      subE: "⫅",
      sube: "⊆",
      subedot: "⫃",
      submult: "⫁",
      subnE: "⫋",
      subne: "⊊",
      subplus: "⪿",
      subrarr: "⥹",
      Subset: "⋐",
      subset: "⊂",
      subseteq: "⊆",
      subseteqq: "⫅",
      SubsetEqual: "⊆",
      subsetneq: "⊊",
      subsetneqq: "⫋",
      subsim: "⫇",
      subsub: "⫕",
      subsup: "⫓",
      succ: "≻",
      succapprox: "⪸",
      succcurlyeq: "≽",
      Succeeds: "≻",
      SucceedsEqual: "⪰",
      SucceedsSlantEqual: "≽",
      SucceedsTilde: "≿",
      succeq: "⪰",
      succnapprox: "⪺",
      succneqq: "⪶",
      succnsim: "⋩",
      succsim: "≿",
      SuchThat: "∋",
      Sum: "∑",
      sum: "∑",
      sung: "♪",
      Sup: "⋑",
      sup: "⊃",
      sup1: "¹",
      sup2: "²",
      sup3: "³",
      supdot: "⪾",
      supdsub: "⫘",
      supE: "⫆",
      supe: "⊇",
      supedot: "⫄",
      Superset: "⊃",
      SupersetEqual: "⊇",
      suphsol: "⟉",
      suphsub: "⫗",
      suplarr: "⥻",
      supmult: "⫂",
      supnE: "⫌",
      supne: "⊋",
      supplus: "⫀",
      Supset: "⋑",
      supset: "⊃",
      supseteq: "⊇",
      supseteqq: "⫆",
      supsetneq: "⊋",
      supsetneqq: "⫌",
      supsim: "⫈",
      supsub: "⫔",
      supsup: "⫖",
      swarhk: "⤦",
      swArr: "⇙",
      swarr: "↙",
      swarrow: "↙",
      swnwar: "⤪",
      szlig: "ß",
      Tab: "	",
      target: "⌖",
      Tau: "Τ",
      tau: "τ",
      tbrk: "⎴",
      Tcaron: "Ť",
      tcaron: "ť",
      Tcedil: "Ţ",
      tcedil: "ţ",
      Tcy: "Т",
      tcy: "т",
      tdot: "⃛",
      telrec: "⌕",
      Tfr: "𝔗",
      tfr: "𝔱",
      there4: "∴",
      Therefore: "∴",
      therefore: "∴",
      Theta: "Θ",
      theta: "θ",
      thetasym: "ϑ",
      thetav: "ϑ",
      thickapprox: "≈",
      thicksim: "∼",
      ThickSpace: "  ",
      thinsp: " ",
      ThinSpace: " ",
      thkap: "≈",
      thksim: "∼",
      THORN: "Þ",
      thorn: "þ",
      Tilde: "∼",
      tilde: "˜",
      TildeEqual: "≃",
      TildeFullEqual: "≅",
      TildeTilde: "≈",
      times: "×",
      timesb: "⊠",
      timesbar: "⨱",
      timesd: "⨰",
      tint: "∭",
      toea: "⤨",
      top: "⊤",
      topbot: "⌶",
      topcir: "⫱",
      Topf: "𝕋",
      topf: "𝕥",
      topfork: "⫚",
      tosa: "⤩",
      tprime: "‴",
      TRADE: "™",
      trade: "™",
      triangle: "▵",
      triangledown: "▿",
      triangleleft: "◃",
      trianglelefteq: "⊴",
      triangleq: "≜",
      triangleright: "▹",
      trianglerighteq: "⊵",
      tridot: "◬",
      trie: "≜",
      triminus: "⨺",
      TripleDot: "⃛",
      triplus: "⨹",
      trisb: "⧍",
      tritime: "⨻",
      trpezium: "⏢",
      Tscr: "𝒯",
      tscr: "𝓉",
      TScy: "Ц",
      tscy: "ц",
      TSHcy: "Ћ",
      tshcy: "ћ",
      Tstrok: "Ŧ",
      tstrok: "ŧ",
      twixt: "≬",
      twoheadleftarrow: "↞",
      twoheadrightarrow: "↠",
      Uacute: "Ú",
      uacute: "ú",
      Uarr: "↟",
      uArr: "⇑",
      uarr: "↑",
      Uarrocir: "⥉",
      Ubrcy: "Ў",
      ubrcy: "ў",
      Ubreve: "Ŭ",
      ubreve: "ŭ",
      Ucirc: "Û",
      ucirc: "û",
      Ucy: "У",
      ucy: "у",
      udarr: "⇅",
      Udblac: "Ű",
      udblac: "ű",
      udhar: "⥮",
      ufisht: "⥾",
      Ufr: "𝔘",
      ufr: "𝔲",
      Ugrave: "Ù",
      ugrave: "ù",
      uHar: "⥣",
      uharl: "↿",
      uharr: "↾",
      uhblk: "▀",
      ulcorn: "⌜",
      ulcorner: "⌜",
      ulcrop: "⌏",
      ultri: "◸",
      Umacr: "Ū",
      umacr: "ū",
      uml: "¨",
      UnderBar: "_",
      UnderBrace: "⏟",
      UnderBracket: "⎵",
      UnderParenthesis: "⏝",
      Union: "⋃",
      UnionPlus: "⊎",
      Uogon: "Ų",
      uogon: "ų",
      Uopf: "𝕌",
      uopf: "𝕦",
      UpArrow: "↑",
      Uparrow: "⇑",
      uparrow: "↑",
      UpArrowBar: "⤒",
      UpArrowDownArrow: "⇅",
      UpDownArrow: "↕",
      Updownarrow: "⇕",
      updownarrow: "↕",
      UpEquilibrium: "⥮",
      upharpoonleft: "↿",
      upharpoonright: "↾",
      uplus: "⊎",
      UpperLeftArrow: "↖",
      UpperRightArrow: "↗",
      Upsi: "ϒ",
      upsi: "υ",
      upsih: "ϒ",
      Upsilon: "Υ",
      upsilon: "υ",
      UpTee: "⊥",
      UpTeeArrow: "↥",
      upuparrows: "⇈",
      urcorn: "⌝",
      urcorner: "⌝",
      urcrop: "⌎",
      Uring: "Ů",
      uring: "ů",
      urtri: "◹",
      Uscr: "𝒰",
      uscr: "𝓊",
      utdot: "⋰",
      Utilde: "Ũ",
      utilde: "ũ",
      utri: "▵",
      utrif: "▴",
      uuarr: "⇈",
      Uuml: "Ü",
      uuml: "ü",
      uwangle: "⦧",
      vangrt: "⦜",
      varepsilon: "ϵ",
      varkappa: "ϰ",
      varnothing: "∅",
      varphi: "ϕ",
      varpi: "ϖ",
      varpropto: "∝",
      vArr: "⇕",
      varr: "↕",
      varrho: "ϱ",
      varsigma: "ς",
      varsubsetneq: "⊊︀",
      varsubsetneqq: "⫋︀",
      varsupsetneq: "⊋︀",
      varsupsetneqq: "⫌︀",
      vartheta: "ϑ",
      vartriangleleft: "⊲",
      vartriangleright: "⊳",
      Vbar: "⫫",
      vBar: "⫨",
      vBarv: "⫩",
      Vcy: "В",
      vcy: "в",
      VDash: "⊫",
      Vdash: "⊩",
      vDash: "⊨",
      vdash: "⊢",
      Vdashl: "⫦",
      Vee: "⋁",
      vee: "∨",
      veebar: "⊻",
      veeeq: "≚",
      vellip: "⋮",
      Verbar: "‖",
      verbar: "|",
      Vert: "‖",
      vert: "|",
      VerticalBar: "∣",
      VerticalLine: "|",
      VerticalSeparator: "❘",
      VerticalTilde: "≀",
      VeryThinSpace: " ",
      Vfr: "𝔙",
      vfr: "𝔳",
      vltri: "⊲",
      vnsub: "⊂⃒",
      vnsup: "⊃⃒",
      Vopf: "𝕍",
      vopf: "𝕧",
      vprop: "∝",
      vrtri: "⊳",
      Vscr: "𝒱",
      vscr: "𝓋",
      vsubnE: "⫋︀",
      vsubne: "⊊︀",
      vsupnE: "⫌︀",
      vsupne: "⊋︀",
      Vvdash: "⊪",
      vzigzag: "⦚",
      Wcirc: "Ŵ",
      wcirc: "ŵ",
      wedbar: "⩟",
      Wedge: "⋀",
      wedge: "∧",
      wedgeq: "≙",
      weierp: "℘",
      Wfr: "𝔚",
      wfr: "𝔴",
      Wopf: "𝕎",
      wopf: "𝕨",
      wp: "℘",
      wr: "≀",
      wreath: "≀",
      Wscr: "𝒲",
      wscr: "𝓌",
      xcap: "⋂",
      xcirc: "◯",
      xcup: "⋃",
      xdtri: "▽",
      Xfr: "𝔛",
      xfr: "𝔵",
      xhArr: "⟺",
      xharr: "⟷",
      Xi: "Ξ",
      xi: "ξ",
      xlArr: "⟸",
      xlarr: "⟵",
      xmap: "⟼",
      xnis: "⋻",
      xodot: "⨀",
      Xopf: "𝕏",
      xopf: "𝕩",
      xoplus: "⨁",
      xotime: "⨂",
      xrArr: "⟹",
      xrarr: "⟶",
      Xscr: "𝒳",
      xscr: "𝓍",
      xsqcup: "⨆",
      xuplus: "⨄",
      xutri: "△",
      xvee: "⋁",
      xwedge: "⋀",
      Yacute: "Ý",
      yacute: "ý",
      YAcy: "Я",
      yacy: "я",
      Ycirc: "Ŷ",
      ycirc: "ŷ",
      Ycy: "Ы",
      ycy: "ы",
      yen: "¥",
      Yfr: "𝔜",
      yfr: "𝔶",
      YIcy: "Ї",
      yicy: "ї",
      Yopf: "𝕐",
      yopf: "𝕪",
      Yscr: "𝒴",
      yscr: "𝓎",
      YUcy: "Ю",
      yucy: "ю",
      Yuml: "Ÿ",
      yuml: "ÿ",
      Zacute: "Ź",
      zacute: "ź",
      Zcaron: "Ž",
      zcaron: "ž",
      Zcy: "З",
      zcy: "з",
      Zdot: "Ż",
      zdot: "ż",
      zeetrf: "ℨ",
      ZeroWidthSpace: "​",
      Zeta: "Ζ",
      zeta: "ζ",
      Zfr: "ℨ",
      zfr: "𝔷",
      ZHcy: "Ж",
      zhcy: "ж",
      zigrarr: "⇝",
      Zopf: "ℤ",
      zopf: "𝕫",
      Zscr: "𝒵",
      zscr: "𝓏",
      zwj: "‍",
      zwnj: "‌"
    }), t.entityMap = t.HTML_ENTITIES;
  })(nu)), nu;
}
var He = {}, Nu;
function Ku() {
  if (Nu) return He;
  Nu = 1;
  var t = Ke().NAMESPACE, a = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, i = new RegExp("[\\-\\.0-9" + a.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"), o = new RegExp("^" + a.source + i.source + "*(?::" + a.source + i.source + "*)?$"), c = 0, D = 1, f = 2, d = 3, T = 4, g = 5, _ = 6, F = 7;
  function q(s, p) {
    this.message = s, this.locator = p, Error.captureStackTrace && Error.captureStackTrace(this, q);
  }
  q.prototype = new Error(), q.prototype.name = q.name;
  function X() {
  }
  X.prototype = {
    parse: function(s, p, A) {
      var h = this.domBuilder;
      h.startDocument(), $(p, p = {}), le(
        s,
        p,
        A,
        h,
        this.errorHandler
      ), h.endDocument();
    }
  };
  function le(s, p, A, h, E) {
    function y(M) {
      if (M > 65535) {
        M -= 65536;
        var z = 55296 + (M >> 10), Fe = 56320 + (M & 1023);
        return String.fromCharCode(z, Fe);
      } else
        return String.fromCharCode(M);
    }
    function x(M) {
      var z = M.slice(1, -1);
      return Object.hasOwnProperty.call(A, z) ? A[z] : z.charAt(0) === "#" ? y(parseInt(z.substr(1).replace("x", "0x"))) : (E.error("entity not found:" + M), M);
    }
    function P(M) {
      if (M > G) {
        var z = s.substring(G, M).replace(/&#?\w+;/g, x);
        v && b(G), h.characters(z, 0, M - G), G = M;
      }
    }
    function b(M, z) {
      for (; M >= N && (z = V.exec(s)); )
        C = z.index, N = C + z[0].length, v.lineNumber++;
      v.columnNumber = M - C + 1;
    }
    for (var C = 0, N = 0, V = /.*(?:\r\n?|\n)|.*$/g, v = h.locator, ue = [{ currentNSMap: p }], me = {}, G = 0; ; ) {
      try {
        var H = s.indexOf("<", G);
        if (H < 0) {
          if (!s.substr(G).match(/^\s*$/)) {
            var Ie = h.doc, ye = Ie.createTextNode(s.substr(G));
            Ie.appendChild(ye), h.currentElement = ye;
          }
          return;
        }
        switch (H > G && P(H), s.charAt(H + 1)) {
          case "/":
            var W = s.indexOf(">", H + 3), K = s.substring(H + 2, W).replace(/[ \t\n\r]+$/g, ""), ie = ue.pop();
            W < 0 ? (K = s.substring(H + 2).replace(/[\s<].*/, ""), E.error("end tag name: " + K + " is not complete:" + ie.tagName), W = H + 1 + K.length) : K.match(/\s</) && (K = K.replace(/[\s<].*/, ""), E.error("end tag name: " + K + " maybe not complete"), W = H + 1 + K.length);
            var _e = ie.localNSMap, te = ie.tagName == K, ae = te || ie.tagName && ie.tagName.toLowerCase() == K.toLowerCase();
            if (ae) {
              if (h.endElement(ie.uri, ie.localName, K), _e)
                for (var Be in _e)
                  Object.prototype.hasOwnProperty.call(_e, Be) && h.endPrefixMapping(Be);
              te || E.fatalError("end tag name: " + K + " is not match the current start tagName:" + ie.tagName);
            } else
              ue.push(ie);
            W++;
            break;
          // end elment
          case "?":
            v && b(H), W = ee(s, H, h);
            break;
          case "!":
            v && b(H), W = j(s, H, h, E);
            break;
          default:
            v && b(H);
            var Q = new S(), xe = ue[ue.length - 1].currentNSMap, W = m(s, H, Q, xe, x, E), Ve = Q.length;
            if (!Q.closed && I(s, W, Q.tagName, me) && (Q.closed = !0, A.nbsp || E.warning("unclosed xml attribute")), v && Ve) {
              for (var ze = Z(v, {}), De = 0; De < Ve; De++) {
                var he = Q[De];
                b(he.offset), he.locator = Z(v, {});
              }
              h.locator = ze, O(Q, h, xe) && ue.push(Q), h.locator = v;
            } else
              O(Q, h, xe) && ue.push(Q);
            t.isHTML(Q.uri) && !Q.closed ? W = R(s, W, Q.tagName, x, h) : W++;
        }
      } catch (M) {
        if (M instanceof q)
          throw M;
        E.error("element parse error: " + M), W = -1;
      }
      W > G ? G = W : P(Math.max(H, G) + 1);
    }
  }
  function Z(s, p) {
    return p.lineNumber = s.lineNumber, p.columnNumber = s.columnNumber, p;
  }
  function m(s, p, A, h, E, y) {
    function x(v, ue, me) {
      A.attributeNames.hasOwnProperty(v) && y.fatalError("Attribute " + v + " redefined"), A.addValue(
        v,
        // @see https://www.w3.org/TR/xml/#AVNormalize
        // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
        // - recursive replacement of (DTD) entity references
        // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
        ue.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, E),
        me
      );
    }
    for (var P, b, C = ++p, N = c; ; ) {
      var V = s.charAt(C);
      switch (V) {
        case "=":
          if (N === D)
            P = s.slice(p, C), N = d;
          else if (N === f)
            N = d;
          else
            throw new Error("attribute equal must after attrName");
          break;
        case "'":
        case '"':
          if (N === d || N === D)
            if (N === D && (y.warning('attribute value must after "="'), P = s.slice(p, C)), p = C + 1, C = s.indexOf(V, p), C > 0)
              b = s.slice(p, C), x(P, b, p - 1), N = g;
            else
              throw new Error("attribute value no end '" + V + "' match");
          else if (N == T)
            b = s.slice(p, C), x(P, b, p), y.warning('attribute "' + P + '" missed start quot(' + V + ")!!"), p = C + 1, N = g;
          else
            throw new Error('attribute value must after "="');
          break;
        case "/":
          switch (N) {
            case c:
              A.setTagName(s.slice(p, C));
            case g:
            case _:
            case F:
              N = F, A.closed = !0;
            case T:
            case D:
              break;
            case f:
              A.closed = !0;
              break;
            //case S_EQ:
            default:
              throw new Error("attribute invalid close char('/')");
          }
          break;
        case "":
          return y.error("unexpected end of input"), N == c && A.setTagName(s.slice(p, C)), C;
        case ">":
          switch (N) {
            case c:
              A.setTagName(s.slice(p, C));
            case g:
            case _:
            case F:
              break;
            //normal
            case T:
            //Compatible state
            case D:
              b = s.slice(p, C), b.slice(-1) === "/" && (A.closed = !0, b = b.slice(0, -1));
            case f:
              N === f && (b = P), N == T ? (y.warning('attribute "' + b + '" missed quot(")!'), x(P, b, p)) : ((!t.isHTML(h[""]) || !b.match(/^(?:disabled|checked|selected)$/i)) && y.warning('attribute "' + b + '" missed value!! "' + b + '" instead!!'), x(b, b, p));
              break;
            case d:
              throw new Error("attribute value missed!!");
          }
          return C;
        /*xml space '\x20' | #x9 | #xD | #xA; */
        case "":
          V = " ";
        default:
          if (V <= " ")
            switch (N) {
              case c:
                A.setTagName(s.slice(p, C)), N = _;
                break;
              case D:
                P = s.slice(p, C), N = f;
                break;
              case T:
                var b = s.slice(p, C);
                y.warning('attribute "' + b + '" missed quot(")!!'), x(P, b, p);
              case g:
                N = _;
                break;
            }
          else
            switch (N) {
              //case S_TAG:void();break;
              //case S_ATTR:void();break;
              //case S_ATTR_NOQUOT_VALUE:void();break;
              case f:
                A.tagName, (!t.isHTML(h[""]) || !P.match(/^(?:disabled|checked|selected)$/i)) && y.warning('attribute "' + P + '" missed value!! "' + P + '" instead2!!'), x(P, P, p), p = C, N = D;
                break;
              case g:
                y.warning('attribute space is required"' + P + '"!!');
              case _:
                N = D, p = C;
                break;
              case d:
                N = T, p = C;
                break;
              case F:
                throw new Error("elements closed character '/' and '>' must be connected to");
            }
      }
      C++;
    }
  }
  function O(s, p, A) {
    for (var h = s.tagName, E = null, V = s.length; V--; ) {
      var y = s[V], x = y.qName, P = y.value, v = x.indexOf(":");
      if (v > 0)
        var b = y.prefix = x.slice(0, v), C = x.slice(v + 1), N = b === "xmlns" && C;
      else
        C = x, b = null, N = x === "xmlns" && "";
      y.localName = C, N !== !1 && (E == null && (E = {}, $(A, A = {})), A[N] = E[N] = P, y.uri = t.XMLNS, p.startPrefixMapping(N, P));
    }
    for (var V = s.length; V--; ) {
      y = s[V];
      var b = y.prefix;
      b && (b === "xml" && (y.uri = t.XML), b !== "xmlns" && (y.uri = A[b || ""]));
    }
    var v = h.indexOf(":");
    v > 0 ? (b = s.prefix = h.slice(0, v), C = s.localName = h.slice(v + 1)) : (b = null, C = s.localName = h);
    var ue = s.uri = A[b || ""];
    if (p.startElement(ue, C, h, s), s.closed) {
      if (p.endElement(ue, C, h), E)
        for (b in E)
          Object.prototype.hasOwnProperty.call(E, b) && p.endPrefixMapping(b);
    } else
      return s.currentNSMap = A, s.localNSMap = E, !0;
  }
  function R(s, p, A, h, E) {
    if (/^(?:script|textarea)$/i.test(A)) {
      var y = s.indexOf("</" + A + ">", p), x = s.substring(p + 1, y);
      if (/[&<]/.test(x))
        return /^script$/i.test(A) ? (E.characters(x, 0, x.length), y) : (x = x.replace(/&#?\w+;/g, h), E.characters(x, 0, x.length), y);
    }
    return p + 1;
  }
  function I(s, p, A, h) {
    var E = h[A];
    return E == null && (E = s.lastIndexOf("</" + A + ">"), E < p && (E = s.lastIndexOf("</" + A)), h[A] = E), E < p;
  }
  function $(s, p) {
    for (var A in s)
      Object.prototype.hasOwnProperty.call(s, A) && (p[A] = s[A]);
  }
  function j(s, p, A, h) {
    var E = s.charAt(p + 2);
    switch (E) {
      case "-":
        if (s.charAt(p + 3) === "-") {
          var y = s.indexOf("-->", p + 4);
          return y > p ? (A.comment(s, p + 4, y - p - 4), y + 3) : (h.error("Unclosed comment"), -1);
        } else
          return -1;
      default:
        if (s.substr(p + 3, 6) == "CDATA[") {
          var y = s.indexOf("]]>", p + 9);
          return A.startCDATA(), A.characters(s, p + 9, y - p - 9), A.endCDATA(), y + 3;
        }
        var x = k(s, p), P = x.length;
        if (P > 1 && /!doctype/i.test(x[0][0])) {
          var b = x[1][0], C = !1, N = !1;
          P > 3 && (/^public$/i.test(x[2][0]) ? (C = x[3][0], N = P > 4 && x[4][0]) : /^system$/i.test(x[2][0]) && (N = x[3][0]));
          var V = x[P - 1];
          return A.startDTD(b, C, N), A.endDTD(), V.index + V[0].length;
        }
    }
    return -1;
  }
  function ee(s, p, A) {
    var h = s.indexOf("?>", p);
    if (h) {
      var E = s.substring(p, h).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
      return E ? (E[0].length, A.processingInstruction(E[1], E[2]), h + 2) : -1;
    }
    return -1;
  }
  function S() {
    this.attributeNames = {};
  }
  S.prototype = {
    setTagName: function(s) {
      if (!o.test(s))
        throw new Error("invalid tagName:" + s);
      this.tagName = s;
    },
    addValue: function(s, p, A) {
      if (!o.test(s))
        throw new Error("invalid attribute:" + s);
      this.attributeNames[s] = this.length, this[this.length++] = { qName: s, value: p, offset: A };
    },
    length: 0,
    getLocalName: function(s) {
      return this[s].localName;
    },
    getLocator: function(s) {
      return this[s].locator;
    },
    getQName: function(s) {
      return this[s].qName;
    },
    getURI: function(s) {
      return this[s].uri;
    },
    getValue: function(s) {
      return this[s].value;
    }
    //	,getIndex:function(uri, localName)){
    //		if(localName){
    //
    //		}else{
    //			var qName = uri
    //		}
    //	},
    //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
    //	getType:function(uri,localName){}
    //	getType:function(i){},
  };
  function k(s, p) {
    var A, h = [], E = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
    for (E.lastIndex = p, E.exec(s); A = E.exec(s); )
      if (h.push(A), A[1]) return h;
  }
  return He.XMLReader = X, He.ParseError = q, He;
}
var Tu;
function Ju() {
  if (Tu) return ke;
  Tu = 1;
  var t = Ke(), a = Ru(), i = Yu(), o = Ku(), c = a.DOMImplementation, D = t.NAMESPACE, f = o.ParseError, d = o.XMLReader;
  function T(m) {
    return m.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028]/g, `
`);
  }
  function g(m) {
    this.options = m || { locator: {} };
  }
  g.prototype.parseFromString = function(m, O) {
    var R = this.options, I = new d(), $ = R.domBuilder || new F(), j = R.errorHandler, ee = R.locator, S = R.xmlns || {}, k = /\/x?html?$/.test(O), s = k ? i.HTML_ENTITIES : i.XML_ENTITIES;
    ee && $.setDocumentLocator(ee), I.errorHandler = _(j, $, ee), I.domBuilder = R.domBuilder || $, k && (S[""] = D.HTML), S.xml = S.xml || D.XML;
    var p = R.normalizeLineEndings || T;
    return m && typeof m == "string" ? I.parse(
      p(m),
      S,
      s
    ) : I.errorHandler.error("invalid doc source"), $.doc;
  };
  function _(m, O, R) {
    if (!m) {
      if (O instanceof F)
        return O;
      m = O;
    }
    var I = {}, $ = m instanceof Function;
    R = R || {};
    function j(ee) {
      var S = m[ee];
      !S && $ && (S = m.length == 2 ? function(k) {
        m(ee, k);
      } : m), I[ee] = S && function(k) {
        S("[xmldom " + ee + "]	" + k + X(R));
      } || function() {
      };
    }
    return j("warning"), j("error"), j("fatalError"), I;
  }
  function F() {
    this.cdata = !1;
  }
  function q(m, O) {
    O.lineNumber = m.lineNumber, O.columnNumber = m.columnNumber;
  }
  F.prototype = {
    startDocument: function() {
      this.doc = new c().createDocument(null, null, null), this.locator && (this.doc.documentURI = this.locator.systemId);
    },
    startElement: function(m, O, R, I) {
      var $ = this.doc, j = $.createElementNS(m, R || O), ee = I.length;
      Z(this, j), this.currentElement = j, this.locator && q(this.locator, j);
      for (var S = 0; S < ee; S++) {
        var m = I.getURI(S), k = I.getValue(S), R = I.getQName(S), s = $.createAttributeNS(m, R);
        this.locator && q(I.getLocator(S), s), s.value = s.nodeValue = k, j.setAttributeNode(s);
      }
    },
    endElement: function(m, O, R) {
      var I = this.currentElement;
      I.tagName, this.currentElement = I.parentNode;
    },
    startPrefixMapping: function(m, O) {
    },
    endPrefixMapping: function(m) {
    },
    processingInstruction: function(m, O) {
      var R = this.doc.createProcessingInstruction(m, O);
      this.locator && q(this.locator, R), Z(this, R);
    },
    ignorableWhitespace: function(m, O, R) {
    },
    characters: function(m, O, R) {
      if (m = le.apply(this, arguments), m) {
        if (this.cdata)
          var I = this.doc.createCDATASection(m);
        else
          var I = this.doc.createTextNode(m);
        this.currentElement ? this.currentElement.appendChild(I) : /^\s*$/.test(m) && this.doc.appendChild(I), this.locator && q(this.locator, I);
      }
    },
    skippedEntity: function(m) {
    },
    endDocument: function() {
      this.doc.normalize();
    },
    setDocumentLocator: function(m) {
      (this.locator = m) && (m.lineNumber = 0);
    },
    //LexicalHandler
    comment: function(m, O, R) {
      m = le.apply(this, arguments);
      var I = this.doc.createComment(m);
      this.locator && q(this.locator, I), Z(this, I);
    },
    startCDATA: function() {
      this.cdata = !0;
    },
    endCDATA: function() {
      this.cdata = !1;
    },
    startDTD: function(m, O, R) {
      var I = this.doc.implementation;
      if (I && I.createDocumentType) {
        var $ = I.createDocumentType(m, O, R);
        this.locator && q(this.locator, $), Z(this, $), this.doc.doctype = $;
      }
    },
    /**
     * @see org.xml.sax.ErrorHandler
     * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
     */
    warning: function(m) {
      console.warn("[xmldom warning]	" + m, X(this.locator));
    },
    error: function(m) {
      console.error("[xmldom error]	" + m, X(this.locator));
    },
    fatalError: function(m) {
      throw new f(m, this.locator);
    }
  };
  function X(m) {
    if (m)
      return `
@` + (m.systemId || "") + "#[line:" + m.lineNumber + ",col:" + m.columnNumber + "]";
  }
  function le(m, O, R) {
    return typeof m == "string" ? m.substr(O, R) : m.length >= O + R || O ? new java.lang.String(m, O, R) + "" : m;
  }
  "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(m) {
    F.prototype[m] = function() {
      return null;
    };
  });
  function Z(m, O) {
    m.currentElement ? m.currentElement.appendChild(O) : m.doc.appendChild(O);
  }
  return ke.__DOMHandler = F, ke.normalizeLineEndings = T, ke.DOMParser = g, ke;
}
var yu;
function Zu() {
  if (yu) return Pe;
  yu = 1;
  var t = Ru();
  return Pe.DOMImplementation = t.DOMImplementation, Pe.XMLSerializer = t.XMLSerializer, Pe.DOMParser = Ju().DOMParser, Pe;
}
var Bu = Zu();
const Qe = "http://schemas.openxmlformats.org/wordprocessingml/2006/main", er = "http://www.w3.org/XML/1998/namespace";
function lu(t, a) {
  return (t == null ? void 0 : t.nodeType) === 1 && t.localName === a;
}
function iu(t, a) {
  return Array.from(t.childNodes || []).filter(
    (i) => a ? lu(i, a) : i.nodeType === 1
  );
}
function cu(t, a = []) {
  for (const i of Array.from(t.childNodes || []))
    lu(i, "t") ? a.push(i) : cu(i, a);
  return a;
}
function ur(t) {
  return cu(t).map((a) => a.textContent ?? "").join("");
}
function rr(t, a) {
  let i = (t == null ? void 0 : t.parentNode) ?? null;
  for (; i; ) {
    if (lu(i, a))
      return i;
    i = i.parentNode;
  }
  return null;
}
function tr(t) {
  return t ? t.cloneNode(!0) : null;
}
function ar(t, a, i) {
  const o = iu(a, "pPr")[0] ?? null, c = iu(a, "r")[0] ?? null, D = c ? iu(c, "rPr")[0] ?? null : null, f = Array.from(a.childNodes || []).filter(
    (g) => !(o && g === o)
  );
  for (const g of f)
    a.removeChild(g);
  const d = t.createElementNS(Qe, "w:r");
  D && d.appendChild(tr(D));
  const T = String(i).split(`
`);
  T.forEach((g, _) => {
    const F = t.createElementNS(Qe, "w:t");
    (g.startsWith(" ") || g.endsWith(" ") || g.includes("  ")) && F.setAttributeNS(er, "xml:space", "preserve"), F.appendChild(t.createTextNode(g)), d.appendChild(F), _ < T.length - 1 && d.appendChild(t.createElementNS(Qe, "w:br"));
  }), a.appendChild(d);
}
async function nr({
  templatePath: t,
  outputPath: a,
  replacements: i
}) {
  const o = await Iu(t, "profe-docx"), c = B.join(o, "word", "document.xml"), D = await L.readFile(c, "utf8"), f = new Bu.DOMParser().parseFromString(D, "application/xml"), d = Array.from(f.getElementsByTagNameNS(Qe, "p"));
  for (const g of d) {
    const _ = cu(g);
    if (_.length === 0)
      continue;
    const F = _.map((Z) => Z.textContent ?? "").join("");
    let q = F;
    for (const [Z, m] of Object.entries(i))
      q = q.replaceAll(Z, m);
    const X = rr(g, "tc");
    (X ? ur(X) : "").includes("Quantidade de Aulas:") && F.includes("{{AVALIACAO}}") && (q = q.replaceAll(i["{{AVALIACAO}}"], i["{{QTD_AULAS}}"])), F.trim() === "´" && (q = ""), q !== F && ar(f, g, q);
  }
  const T = new Bu.XMLSerializer().serializeToString(f);
  await L.writeFile(c, T, "utf8"), await Xu(o, a);
}
const ir = {
  name: "plano_de_aula",
  strict: !0,
  schema: {
    type: "object",
    additionalProperties: !1,
    properties: {
      disciplinaTitulo: { type: "string" },
      professor: { type: "string" },
      turmas: { type: "string" },
      disciplina: { type: "string" },
      temaDaAula: { type: "string" },
      conteudo: { type: "string" },
      habilidades: { type: "string" },
      metodologia: { type: "string" },
      objetivos: { type: "string" },
      recursos: { type: "string" },
      avaliacao: { type: "string" },
      quantidadeAulas: { type: "string" },
      dataDe: { type: "string" },
      dataAte: { type: "string" },
      aulaNumero: { type: "string" },
      anoSerieSlug: { type: "string" }
    },
    required: [
      "disciplinaTitulo",
      "professor",
      "turmas",
      "disciplina",
      "temaDaAula",
      "conteudo",
      "habilidades",
      "metodologia",
      "objetivos",
      "recursos",
      "avaliacao",
      "quantidadeAulas",
      "dataDe",
      "dataAte",
      "aulaNumero",
      "anoSerieSlug"
    ]
  }
};
function or({
  sources: t,
  instructionContent: a,
  instructionFileName: i,
  outputConfig: o
}) {
  const c = t.map((d) => d.fileName).join(", "), D = t.map(
    (d, T) => `### INICIO_FONTE_${T + 1}
Arquivo: ${d.fileName}
${d.fullText}
### FIM_FONTE_${T + 1}`
  ).join(`

---

`), f = [
    o != null && o.professor ? `- professor: usar exatamente "${o.professor}"` : null,
    o != null && o.turmas ? `- turmas: usar exatamente "${o.turmas}"` : null,
    o != null && o.quantidadeAulas ? `- quantidade de aulas: usar exatamente "${o.quantidadeAulas}"` : null,
    o != null && o.dataDe ? `- data inicial do período: usar exatamente "${o.dataDe}"` : null,
    o != null && o.dataAte ? `- data final do período: usar exatamente "${o.dataAte}"` : null
  ].filter(Boolean);
  return [
    "Você vai transformar o conteúdo de uma ou mais aulas em PowerPoint em um único plano de aula pronto para preencher um template DOCX.",
    "Responda apenas com JSON compatível com o schema solicitado.",
    "Escreva em português do Brasil.",
    "Use redação final de uso, não copie instruções de metadocumento, não use placeholders.",
    "Você DEVE considerar integralmente todas as fontes fornecidas.",
    "É um erro basear o plano apenas na primeira fonte quando houver 2 ou 3 arquivos.",
    "Se houver múltiplas fontes, trate o conjunto como uma sequência pedagógica única e coerente.",
    "Antes de responder, compare as fontes e incorpore contribuições de cada uma no plano final.",
    a ? `Use a instrução abaixo como regra principal de transformação. Arquivo da instrução: ${i || "instrucao-default.md"}` : "Use os critérios abaixo como regra principal de transformação.",
    a ? "" : null,
    a || null,
    a ? "" : null,
    "Critérios editoriais:",
    "- tema específico e claro",
    "- conteúdo como tópicos/conceitos efetivamente trabalhados",
    "- habilidades como ações observáveis; incluir códigos curriculares se existirem no material",
    "- metodologia descrevendo como a aula acontece",
    "- objetivos com verbos no infinitivo e foco no que o estudante desenvolverá",
    "- recursos concretos",
    "- avaliação com critérios observáveis",
    "- professor deve ser 'A definir' se não houver nome no material",
    "- período de realização deve usar informação do material; se não houver, usar 'conforme calendário escolar'",
    "- quantidade de aulas deve ser inferida apenas se segura; caso contrário, usar 'A definir'",
    "- aulaNumero deve ter apenas dois dígitos, como 01",
    "- anoSerieSlug deve ser um slug curto, como '9o-ano' ou '1a-serie'",
    "- com 2 ou 3 fontes, o tema, o conteúdo, a metodologia e a avaliação devem refletir o conjunto das fontes, não apenas a primeira",
    f.length > 0 ? "" : null,
    f.length > 0 ? "Configurações de saída definidas pela interface:" : null,
    f.length > 0 ? f.join(`
`) : null,
    "",
    `Quantidade de arquivos-fonte: ${t.length}`,
    `Arquivos-fonte: ${c}`,
    "",
    "Conteúdo extraído dos PPTX:",
    D
  ].filter(Boolean).join(`
`);
}
function sr(t) {
  var c, D;
  if (typeof (t == null ? void 0 : t.output_text) == "string" && t.output_text.trim())
    return t.output_text.trim();
  const a = Array.isArray(t == null ? void 0 : t.output) ? t.output : [], i = [], o = [];
  for (const f of a)
    if (Array.isArray(f == null ? void 0 : f.content))
      for (const d of f.content)
        (d == null ? void 0 : d.type) === "output_text" && typeof d.text == "string" && i.push(d.text), (d == null ? void 0 : d.type) === "refusal" && typeof d.refusal == "string" && o.push(d.refusal);
  if (i.length > 0)
    return i.join(`
`).trim();
  if (o.length > 0)
    throw new Error(`A OpenAI recusou a geração: ${o.join(" ")}`);
  if ((t == null ? void 0 : t.status) === "incomplete") {
    const f = ((c = t == null ? void 0 : t.incomplete_details) == null ? void 0 : c.reason) || ((D = t == null ? void 0 : t.incomplete_details) == null ? void 0 : D.type) || "resposta incompleta";
    throw new Error(`A OpenAI retornou uma resposta incompleta: ${f}.`);
  }
  throw new Error("A OpenAI não retornou texto estruturado para o plano de aula.");
}
async function lr({
  apiKey: t,
  model: a,
  sources: i,
  instructionContent: o,
  instructionFileName: c,
  outputConfig: D
}) {
  const f = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`
    },
    body: JSON.stringify({
      model: a,
      input: or({
        sources: i,
        instructionContent: o,
        instructionFileName: c,
        outputConfig: D
      }),
      text: {
        format: {
          type: "json_schema",
          ...ir
        },
        verbosity: "medium"
      }
    })
  });
  if (!f.ok) {
    const g = await f.text();
    throw new Error(`Falha na OpenAI API: ${f.status} ${g}`);
  }
  const d = await f.json(), T = sr(d);
  return JSON.parse(T);
}
const Te = "plano-de-aula-template-com-ancoras.docx";
function cr(t) {
  return `${String(t || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-_.]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/\.docx$/i, "") || "template"}.docx`;
}
async function Lu(t) {
  return await L.mkdir(t, { recursive: !0 }), (await L.readdir(t, { withFileTypes: !0 })).filter((o) => o.isFile() && o.name.toLowerCase().endsWith(".docx")).sort((o, c) => o.name.localeCompare(c.name, "pt-BR")).map((o) => ({
    fileName: o.name,
    path: B.join(t, o.name),
    isDefaultBuiltIn: o.name === Te
  }));
}
async function pr(t, a) {
  await L.mkdir(t, { recursive: !0 });
  const i = cr(B.basename(a)), o = B.join(t, i);
  return await L.copyFile(a, o), {
    fileName: i,
    path: o
  };
}
const mr = qu(import.meta.url), dr = B.dirname(mr);
function fr(t) {
  const a = [
    t,
    B.resolve(t, ".."),
    B.resolve(t, "..", ".."),
    process.cwd()
  ];
  for (const i of a)
    if (Ou.existsSync(B.join(i, "package.json")))
      return i;
  return B.resolve(t, "..");
}
const Oe = fr(dr);
function Xe(t) {
  return Ou.mkdirSync(t, { recursive: !0 }), t;
}
function Ue() {
  return B.join(Oe, "entradas");
}
function Me() {
  return B.join(Oe, "saidas");
}
function pe(t = {}) {
  const a = B.resolve(t.inputDir || Ue()), i = B.resolve(t.outputDir || Me());
  return {
    root: Oe,
    entradasDir: Xe(a),
    saidasDir: Xe(i),
    templatesDir: Xe(B.join(Oe, "templates")),
    instrucoesDir: Xe(B.join(Oe, "instrucoes")),
    defaultTemplatePath: B.join(
      Oe,
      "templates",
      t.defaultTemplateFileName || Te
    )
  };
}
const ne = "preencher-plano-de-aula-a-partir-do-pptx.md", ou = `---
name: preencher-plano-de-aula-a-partir-do-pptx
description: Use esta instrução quando eu pedir para preencher o template de plano de aula com âncoras \`.docx\` a partir de 1 a 3 arquivos \`.pptx\`, consolidando os conteúdos em um único plano e respeitando as configurações de saída definidas na interface.
---

# Instrução

Quando eu mencionar \`preencher-plano-de-aula-a-partir-do-pptx\`, execute este fluxo.

## Objetivo

Ler de 1 a 3 arquivos \`.pptx\` de aula, consolidar esses materiais em um único plano de aula, preencher o template \`.docx\` com âncoras \`{{...}}\` e gerar um novo documento final. Usar os critérios pedagógicos e editoriais descritos nesta instrução para melhorar a qualidade do preenchimento de cada campo.

## Entradas esperadas

- De 1 a 3 arquivos \`.pptx\` com o conteúdo de uma aula ou sequência de aulas relacionadas.
- Como template padrão de saída, usar:
  \`templates/plano-de-aula-template-com-ancoras.docx\`
- Opcionalmente, aceitar outro template \`.docx\` com âncoras se o usuário indicar explicitamente.
- A interface pode fornecer explicitamente estes campos de saída, que têm prioridade sobre qualquer inferência do material:
  - nome do professor
  - turmas
  - quantidade de aulas
  - período de realização (\`DATA_DE\` e \`DATA-ATÉ\`)
- Quando possível, a interface pode pré-preencher \`turmas\` a partir da leitura dos \`.pptx\`, mas o valor final continua editável pelo usuário e deve ser respeitado se ele fizer ajustes.

Convenção de caminhos do projeto:

- arquivos-fonte da aula em \`entradas/\`
- templates em \`templates/\`
- instruções em \`instrucoes/\`
- arquivos gerados em \`saidas/\`

## Resultado esperado

- Gerar uma cópia preenchida do \`.docx\`.
- Preservar o template original.
- Validar que não restaram placeholders \`{{...}}\` no arquivo final.
- Garantir que o texto preenchido não seja apenas copiado dos \`.pptx\`, mas organizado conforme os critérios pedagógicos desta instrução.
- Ser idempotente: repetir a execução com os mesmos arquivos de entrada deve produzir o mesmo arquivo de saída, sem criar variantes desnecessárias nem acumular duplicatas.

## Procedimento

1. Confirmar que todos os arquivos-fonte existem e são legíveis.
2. Se o usuário não indicar outro template, usar como base o arquivo:
   \`templates/plano-de-aula-template-com-ancoras.docx\`
3. Extrair o texto de todos os \`.pptx\`, incluindo conteúdo dos slides e, se necessário, slides de orientação para professores.
4. Identificar todas as âncoras do template \`{{...}}\`, inclusive quando estiverem quebradas em múltiplos trechos internos do Word.
5. Montar um único plano a partir do conjunto dos materiais, tratando os \`.pptx\` como partes de uma mesma proposta de aula ou sequência curta de aulas.
6. Analisar cada \`.pptx\` individualmente antes da síntese final, garantindo que todos contribuam para o plano e que nenhuma fonte seja ignorada.
7. Montar o mapeamento entre as âncoras do template e o conteúdo consolidado dos \`.pptx\`, refinando a redação com base nos critérios descritos nesta instrução.
8. Se a interface tiver fornecido professor, turmas, quantidade de aulas ou período de realização, usar esses valores explicitamente no resultado final.
9. Preencher o \`.docx\` em uma cópia nova, nunca sobrescrevendo o template original sem pedido explícito.
10. Validar o arquivo final:
   - conferir se o conteúdo principal foi inserido;
   - verificar se não sobrou nenhum \`{{...}}\`;
   - corrigir placeholders quebrados em múltiplos trechos do XML, se houver;
   - corrigir problemas estruturais do template apenas no arquivo gerado, se necessário.

## Idempotência

Esta instrução deve ser executada de forma idempotente.

- Com os mesmos arquivos de entrada, usar sempre o mesmo caminho de saída derivado do conteúdo.
- Se o arquivo de saída já existir e já estiver consistente com a entrada atual, reutilizá-lo em vez de criar outro.
- Se o arquivo de saída já existir mas estiver desatualizado em relação à entrada atual, atualizá-lo no mesmo caminho.
- Nunca criar nomes incrementais como \`copia\`, \`final\`, \`novo\`, \`v2\` ou semelhantes, exceto se o usuário pedir explicitamente.
- Nunca duplicar ou renomear template, instrução ou arquivo-fonte apenas por executar o fluxo novamente.
- Se houver necessidade de corrigir um problema estrutural do template, aplicar a correção apenas no arquivo gerado final, de forma determinística.

## Regras de preenchimento

- Priorizar conteúdo explícito dos \`.pptx\`.
- Tratar o arquivo \`templates/plano-de-aula-template-com-ancoras.docx\` como template padrão de saída.
- Se o template tiver placeholders quebrados em vários trechos internos do Word, tratá-los como um único placeholder lógico.
- Se os \`.pptx\` não trouxerem um dado objetivo para um campo, preencher com uma marcação pragmática e explícita em vez de inventar informação.
- Quando houver mais de um \`.pptx\`, consolidar os materiais em um único plano coerente, sem tratar cada apresentação como um plano separado.
- Quando houver 2 ou 3 \`.pptx\`, é obrigatório considerar o conjunto inteiro; ignorar a segunda ou terceira fonte é erro de execução.
- O plano final deve refletir progressão, complementaridade ou distribuição de atividades entre as fontes sempre que isso estiver presente no material.
- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores devem prevalecer sobre qualquer inferência do material.
- Manter consistência com o nível de ensino, disciplina, tema, objetivos, metodologia, recursos e avaliação encontrados no material.
- Se o template tiver erro estrutural, como um campo apontando para a âncora errada, corrigir isso apenas no arquivo gerado.
- Não transformar a resposta em transcrição dos slides; consolidar e escrever o plano de aula em formato final de uso.
- Manter o processo determinístico sempre que possível: mesmos insumos devem levar ao mesmo mapeamento, mesmo nome de arquivo e mesma estrutura de saída.

## Defaults permitidos quando faltarem dados

- \`PROFESSOR\`: usar o valor configurado na interface; se não houver, \`A definir\`
- \`PERÍODO DE REALIZAÇÃO\`: usar informação objetiva do material; se não houver, usar algo como \`conforme calendário escolar\`
- \`Quantidade de Aulas\`: usar o valor configurado na interface; se não houver, inferir pelo material apenas se for seguro; caso contrário, usar \`A definir\`

## Mapeamento sugerido

- \`{{DISCIPLINA-TITULO}}\`: combinação curta para o cabeçalho, como \`Arte - 9º ano\`
- \`{{DISCIPLINA}}\`: disciplina principal do material
- \`{{TURMAS}}\`: ano/série e segmento, preferindo o valor explicitamente configurado na interface quando houver
- \`{{TEMA_DA_AULA}}\`: título central da aula
- \`{{CONTEÚDO}}\`: tópicos e conceitos trabalhados
- \`{{HABILIDADES}}\`: habilidades, competências e códigos curriculares presentes
- \`{{METODOLOGIA}}\`: dinâmica, estratégias, etapas e condução da aula
- \`{{OBJETIVOS}}\`: objetivos de aprendizagem explícitos ou claramente inferíveis
- \`{{RECURSOS}}\`: materiais e recursos necessários
- \`{{AVALIACAO}}\`: critérios, dimensão avaliada e forma de observação/sistematização
- \`{{DATA_DE}}\` e \`{{DATA-ATÉ}}\`: período de realização, preferindo os valores explicitamente configurados na interface quando houver

## Critérios de redação por campo

Usar estes critérios para melhorar a qualidade do preenchimento das âncoras:

- \`{{TEMA_DA_AULA}}\`: escrever um tema específico, claro e diretamente ligado ao recorte da aula.
- \`{{CONTEÚDO}}\`: desdobrar o tema em tópicos e conceitos que realmente serão trabalhados na aula.
- \`{{HABILIDADES}}\`: priorizar habilidades como ações observáveis de aprendizagem; incluir códigos curriculares quando estiverem no material.
- \`{{METODOLOGIA}}\`: descrever como a aula acontecerá de fato, com estratégias, dinâmica, mediação, escuta, análise, exposição, prática e socialização.
- \`{{OBJETIVOS}}\`: redigir objetivos claros, preferencialmente com verbos no infinitivo e, quando fizer sentido, explicitar a finalidade do desenvolvimento proposto.
- \`{{RECURSOS}}\`: listar materiais e suportes concretos necessários para executar a aula, detalhando itens e quantidades quando isso estiver claro no material.
- \`{{AVALIACAO}}\`: indicar como a aprendizagem será observada ou verificada e quais critérios serão considerados.

## Observações do template com âncoras

O template \`templates/plano-de-aula-template-com-ancoras.docx\` tem um problema estrutural:

- o campo \`Quantidade de Aulas\` reaproveita a âncora \`{{AVALIACAO}}\`;
- ao preencher, corrigir isso apenas no arquivo final gerado, substituindo esse trecho pelo valor adequado de quantidade de aulas.

## Nome do arquivo de saída

Salvar o resultado sempre na pasta:

\`saidas/\`

Usar obrigatoriamente esta convenção de nome:

\`plano-de-aula-{disciplina-slug}-{ano-serie-slug}-aula-{nn}.docx\`

Regras para composição:

- \`disciplina-slug\`: disciplina em minúsculas, sem acentos e com palavras separadas por hífen.
- \`ano-serie-slug\`: ano ou série em minúsculas, sem acentos e com palavras separadas por hífen.
- \`nn\`: número da aula com dois dígitos, como \`01\`, \`02\`, \`03\`.

Exemplo:

\`saidas/plano-de-aula-arte-9o-ano-aula-01.docx\`

Esse nome deve ser estável entre execuções com os mesmos insumos.

## Resposta final

Na resposta final:

- informar o caminho do arquivo gerado;
- dizer se o template original foi preservado;
- dizer se todos os placeholders foram substituídos;
- dizer se os critérios desta instrução foram aplicados no refinamento do texto;
- apontar rapidamente qualquer campo preenchido com fallback.
`;
function Pu(t) {
  return `${String(t || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-_.]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/\.md$/i, "") || "instrucao"}.md`;
}
async function pu(t) {
  const a = B.join(t, ne);
  try {
    await L.access(a);
  } catch {
    await L.writeFile(a, ou, "utf8");
  }
  return a;
}
async function Dr(t) {
  await pu(t);
  const a = await L.readdir(t, { withFileTypes: !0 });
  return await Promise.all(
    a.filter((o) => o.isFile() && o.name.toLowerCase().endsWith(".md")).sort((o, c) => o.name.localeCompare(c.name, "pt-BR")).map(async (o) => {
      const c = B.join(t, o.name), D = await L.readFile(c, "utf8");
      return {
        fileName: o.name,
        path: c,
        content: D,
        isDefaultBuiltIn: o.name === ne
      };
    })
  );
}
async function hr(t, { fileName: a, content: i }) {
  await L.mkdir(t, { recursive: !0 });
  const o = Pu(a), c = B.join(t, o);
  return await L.writeFile(c, String(i ?? ""), "utf8"), {
    fileName: o,
    path: c
  };
}
async function ku(t, a) {
  await pu(t);
  const i = Pu(a), o = B.join(t, i), c = await L.readFile(o, "utf8");
  return {
    fileName: i,
    path: o,
    content: c,
    isDefaultBuiltIn: i === ne
  };
}
async function Ar(t) {
  await L.mkdir(t, { recursive: !0 });
  const a = B.join(t, ne);
  return await L.writeFile(a, ou, "utf8"), {
    fileName: ne,
    path: a,
    content: ou,
    isDefaultBuiltIn: !0
  };
}
const gr = qu(import.meta.url), xu = B.dirname(gr), vr = "settings.json";
function Fu(t) {
  return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
function Er(t) {
  return String(t).replace(/\D/g, "").padStart(2, "0").slice(-2);
}
function Uu() {
  return B.join(Ne.getPath("userData"), vr);
}
async function se() {
  try {
    const t = await L.readFile(Uu(), "utf8"), a = JSON.parse(t);
    return {
      apiKey: a.apiKey || "",
      model: a.model || "gpt-5.4-mini",
      professorName: a.professorName || "",
      planTurmas: a.planTurmas || "",
      planQuantidadeAulas: a.planQuantidadeAulas || "1",
      planDataDe: a.planDataDe || "",
      planDataAte: a.planDataAte || "",
      inputDir: a.inputDir || Ue(),
      outputDir: a.outputDir || Me(),
      defaultTemplateFileName: a.defaultTemplateFileName || Te,
      defaultInstructionFileName: a.defaultInstructionFileName || ne
    };
  } catch {
    return {
      apiKey: "",
      model: "gpt-5.4-mini",
      professorName: "",
      planTurmas: "",
      planQuantidadeAulas: "1",
      planDataDe: "",
      planDataAte: "",
      inputDir: Ue(),
      outputDir: Me(),
      defaultTemplateFileName: Te,
      defaultInstructionFileName: ne
    };
  }
}
async function je(t) {
  return await L.mkdir(Ne.getPath("userData"), { recursive: !0 }), await L.writeFile(Uu(), JSON.stringify(t, null, 2), "utf8"), t;
}
function wr(t, a) {
  const { saidasDir: i } = a, o = Fu(t.disciplina || "disciplina"), c = Fu(t.anoSerieSlug || "ano"), D = Er(t.aulaNumero || "1"), f = `plano-de-aula-${o}-${c}-aula-${D}.docx`;
  return B.join(i, f);
}
async function Mu(t) {
  const a = await L.stat(t);
  return {
    name: B.basename(t),
    path: t,
    modifiedAt: a.mtime.toISOString(),
    modifiedAtMs: a.mtimeMs
  };
}
function br(t) {
  const a = String(t || "").replace(/\s+/g, " ").trim(), i = a.match(
    /turmas?\s*[:\-]\s*([^.|\n\r]+?)(?:slide\s+\d+[: ]|$)/i
  );
  if (i != null && i[1])
    return i[1].trim();
  const o = [
    ...a.matchAll(
      /\b(\d{1,2}\s*(?:º|°|o|ª|a)?\s*(?:ano|anos|serie|série))\b/gi
    )
  ].map((D) => D[1].replace(/\s+/g, " ").trim()).filter(Boolean), c = [...new Set(o)];
  return c.length === 0 ? "" : c.slice(0, 3).join(", ");
}
function Cr(t) {
  return {
    "{{DISCIPLINA-TITULO}}": t.disciplinaTitulo,
    "{{PROFESSOR}}": t.professor,
    "{{TURMAS}}": t.turmas,
    "{{DISCIPLINA}}": t.disciplina,
    "{{TEMA_DA_AULA}}": t.temaDaAula,
    "{{CONTEÚDO}}": t.conteudo,
    "{{HABILIDADES}}": t.habilidades,
    "{{METODOLOGIA}}": t.metodologia,
    "{{OBJETIVOS}}": t.objetivos,
    "{{RECURSOS}}": t.recursos,
    "{{AVALIACAO}}": t.avaliacao,
    "{{QTD_AULAS}}": t.quantidadeAulas,
    "{{DATA_DE}}": t.dataDe,
    "{{DATA-ATÉ}}": t.dataAte
  };
}
async function Nr(t, a) {
  if (a) {
    const o = B.join(t.templatesDir, a);
    try {
      return await L.access(o), o;
    } catch {
    }
  }
  const i = await Lu(t.templatesDir);
  if (i.length > 0)
    return i[0].path;
  throw new Error(
    "Nenhum template .docx encontrado em templates/. Importe ou adicione um template antes de gerar o plano."
  );
}
function We(t) {
  const a = String(t || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a))
    return a;
  const [i, o, c] = a.split("-");
  return `${c}/${o}/${i}`;
}
function Tr(t, a, i) {
  const o = String((a == null ? void 0 : a.professor) || "").trim() || String(i.professorName || "").trim() || t.professor || "A definir", c = String((a == null ? void 0 : a.turmas) || "").trim() || String(i.planTurmas || "").trim() || t.turmas || "A definir", D = String((a == null ? void 0 : a.quantidadeAulas) || "").trim() || String(i.planQuantidadeAulas || "").trim() || t.quantidadeAulas || "A definir", f = We(a == null ? void 0 : a.dataDe) || We(i.planDataDe) || t.dataDe || "conforme calendário escolar", d = We(a == null ? void 0 : a.dataAte) || We(i.planDataAte) || t.dataAte || f;
  return {
    ...t,
    professor: o,
    turmas: c,
    quantidadeAulas: D,
    dataDe: f,
    dataAte: d
  };
}
async function Su() {
  const t = Ne.isPackaged ? B.join(process.resourcesPath, "app.asar", "electron", "preload.cjs") : B.join(xu, "..", "electron", "preload.cjs"), a = new ge({
    width: 1260,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#efe2c6",
    webPreferences: {
      preload: t,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  process.env.VITE_DEV_SERVER_URL ? await a.loadURL(process.env.VITE_DEV_SERVER_URL) : await a.loadFile(B.join(xu, "..", "dist", "index.html"));
}
J.handle("app:get-state", async () => {
  let t = await se();
  const a = pe(t);
  await pu(a.instrucoesDir);
  const i = await L.readdir(a.entradasDir, { withFileTypes: !0 }), o = await Dr(a.instrucoesDir), c = await Lu(a.templatesDir);
  !c.some(
    (d) => d.fileName === t.defaultTemplateFileName
  ) && c.length > 0 && (t = { ...t, defaultTemplateFileName: c[0].fileName }, await je(t));
  const f = await Promise.all(
    i.filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".pptx")).map((d) => Mu(B.join(a.entradasDir, d.name)))
  );
  return {
    projectPaths: a,
    settings: {
      ...t,
      apiKeyConfigured: !!t.apiKey
    },
    instructions: o,
    templates: c,
    availableInputs: f
  };
});
J.handle("settings:get", async () => {
  const t = await se();
  return {
    ...t,
    apiKeyConfigured: !!t.apiKey
  };
});
J.handle("settings:save", async (t, a) => {
  const i = {
    apiKey: String(a.apiKey ?? "").trim(),
    model: String(a.model ?? "gpt-5.4-mini").trim() || "gpt-5.4-mini",
    professorName: String(a.professorName ?? "").trim(),
    planTurmas: String(a.planTurmas ?? "").trim(),
    planQuantidadeAulas: String(a.planQuantidadeAulas ?? "1").trim() || "1",
    planDataDe: String(a.planDataDe ?? "").trim(),
    planDataAte: String(a.planDataAte ?? "").trim(),
    inputDir: String(a.inputDir ?? Ue()).trim() || Ue(),
    outputDir: String(a.outputDir ?? Me()).trim() || Me(),
    defaultTemplateFileName: String(a.defaultTemplateFileName ?? Te).trim() || Te,
    defaultInstructionFileName: String(a.defaultInstructionFileName ?? ne).trim() || ne
  }, o = pe(i);
  await L.mkdir(o.entradasDir, { recursive: !0 }), await L.mkdir(o.saidasDir, { recursive: !0 });
  const c = await je(i);
  return {
    ...c,
    apiKeyConfigured: !!c.apiKey
  };
});
J.handle("files:pick-inputs", async () => {
  const t = await se(), { entradasDir: a } = pe(t), i = ge.getFocusedWindow() ?? ge.getAllWindows()[0], o = await su.showOpenDialog(i, {
    title: "Selecionar aulas em PowerPoint",
    defaultPath: a,
    properties: ["openFile", "multiSelections"],
    buttonLabel: "Selecionar arquivos",
    filters: [{ name: "PowerPoint", extensions: ["pptx"] }]
  });
  return o.canceled || o.filePaths.length === 0 ? [] : Promise.all(o.filePaths.map((c) => Mu(c)));
});
J.handle("plans:detect-fields", async (t, a) => {
  const i = Array.isArray(a == null ? void 0 : a.inputPaths) ? a.inputPaths.filter(Boolean).slice(0, 3) : [];
  if (i.length === 0)
    return { turmas: "" };
  const o = await Promise.all(
    i.map(async (c) => {
      const { fullText: D } = await _u(c);
      return D;
    })
  );
  return {
    turmas: br(o.join(`
`))
  };
});
J.handle("files:pick-directory", async (t, a) => {
  const i = await se(), o = pe(i), c = ge.getFocusedWindow() ?? ge.getAllWindows()[0], D = a === "output" ? o.saidasDir : o.entradasDir, f = await su.showOpenDialog(c, {
    title: a === "output" ? "Selecionar pasta de saída" : "Selecionar pasta de entrada",
    defaultPath: D,
    properties: ["openDirectory", "createDirectory", "promptToCreate"],
    buttonLabel: "Selecionar pasta"
  });
  return f.canceled || f.filePaths.length === 0 ? null : f.filePaths[0];
});
J.handle("templates:pick-template", async () => {
  const t = await se(), a = pe(t), i = ge.getFocusedWindow() ?? ge.getAllWindows()[0], o = await su.showOpenDialog(i, {
    title: "Selecionar template DOCX",
    defaultPath: a.templatesDir,
    properties: ["openFile"],
    buttonLabel: "Selecionar template",
    filters: [{ name: "Word", extensions: ["docx"] }]
  });
  return o.canceled || o.filePaths.length === 0 ? null : o.filePaths[0];
});
J.handle("instructions:save", async (t, a) => {
  const i = pe(), o = await hr(i.instrucoesDir, {
    fileName: a == null ? void 0 : a.fileName,
    content: a == null ? void 0 : a.content
  });
  return ku(i.instrucoesDir, o.fileName);
});
J.handle("instructions:reset-default", async () => {
  const t = pe(), a = await Ar(t.instrucoesDir), i = await se();
  return await je({
    ...i,
    defaultInstructionFileName: ne
  }), a;
});
J.handle("instructions:set-default", async (t, a) => {
  const o = {
    ...await se(),
    defaultInstructionFileName: String(a || ne)
  };
  return await je(o), o;
});
J.handle("templates:import", async (t, a) => {
  if (!a)
    throw new Error("Nenhum template foi selecionado.");
  const i = await se(), o = pe(i);
  return await pr(o.templatesDir, a);
});
J.handle("templates:set-default", async (t, a) => {
  const o = {
    ...await se(),
    defaultTemplateFileName: String(a || Te)
  };
  return await je(o), o;
});
J.handle("files:open-path", async (t, a) => a ? (await ju.openPath(a), !0) : !1);
J.handle("plans:generate", async (t, a) => {
  const i = Array.isArray(a == null ? void 0 : a.inputPaths) ? a.inputPaths.filter(Boolean) : [], o = (a == null ? void 0 : a.outputConfig) || {};
  if (i.length === 0)
    throw new Error("Selecione pelo menos um arquivo .pptx.");
  if (i.length > 3)
    throw new Error("Use no máximo 3 arquivos .pptx por plano de aula.");
  const c = await se(), D = pe(c);
  if (!c.apiKey)
    throw new Error("Configure a OpenAI API key antes de gerar o plano.");
  const f = await ku(
    D.instrucoesDir,
    c.defaultInstructionFileName || ne
  );
  try {
    const d = [];
    for (const X of i) {
      const { fullText: le } = await _u(X);
      d.push({
        fileName: B.basename(X),
        fullText: le
      });
    }
    const T = await lr({
      apiKey: c.apiKey,
      model: c.model || "gpt-5.4-mini",
      sources: d,
      instructionContent: f.content,
      instructionFileName: f.fileName,
      outputConfig: o
    }), g = Tr(T, o, c), _ = wr(g, D), F = Cr(g), q = await Nr(
      D,
      c.defaultTemplateFileName
    );
    return await nr({ templatePath: q, outputPath: _, replacements: F }), {
      count: 1,
      failedCount: 0,
      model: c.model || "gpt-5.4-mini",
      instructionFileName: f.fileName,
      items: [
        {
          inputPaths: i,
          outputPath: _,
          summary: {
            disciplina: g.disciplina,
            turma: g.turmas,
            tema: g.temaDaAula
          }
        }
      ],
      failures: []
    };
  } catch (d) {
    return {
      count: 0,
      failedCount: 1,
      model: c.model || "gpt-5.4-mini",
      instructionFileName: f.fileName,
      items: [],
      failures: [
        {
          inputPath: i.join(", "),
          fileName: i.map((T) => B.basename(T)).join(", "),
          message: d instanceof Error ? d.message : "Falha desconhecida na geração."
        }
      ]
    };
  }
});
J.handle("files:clear-inputs", async () => {
  const t = await se(), a = pe(t), o = (await L.readdir(a.entradasDir, { withFileTypes: !0 })).filter((c) => c.isFile() && c.name.toLowerCase().endsWith(".pptx")).map((c) => B.join(a.entradasDir, c.name));
  for (const c of o)
    await L.unlink(c);
  return {
    removedCount: o.length
  };
});
Ne.whenReady().then(async () => {
  await Su(), Ne.on("activate", async () => {
    ge.getAllWindows().length === 0 && await Su();
  });
});
Ne.on("window-all-closed", () => {
  process.platform !== "darwin" && Ne.quit();
});
