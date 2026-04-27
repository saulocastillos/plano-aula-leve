import e from "node:fs/promises";
import t from "node:path";
import { fileURLToPath as n } from "node:url";
import { BrowserWindow as r, app as i, dialog as a, ipcMain as o, shell as s } from "electron";
import c from "node:os";
import { execFile as l } from "node:child_process";
import { promisify as u } from "node:util";
import d from "node:fs";
//#region \0rolldown/runtime.js
var f = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), p = u(l);
async function m(e, t, n = {}) {
	await p(e, t, {
		maxBuffer: 1024 * 1024 * 20,
		...n
	});
}
async function h(n) {
	return e.mkdtemp(t.join(c.tmpdir(), `${n}-`));
}
async function g(n, r) {
	let i = await h(r);
	if (process.platform === "win32") {
		let a = t.join(i, `${r}.zip`);
		await e.copyFile(n, a), await m("powershell.exe", [
			"-NoProfile",
			"-Command",
			`Expand-Archive -LiteralPath '${a.replace(/'/g, "''")}' -DestinationPath '${i.replace(/'/g, "''")}' -Force`
		]);
	} else await m("unzip", [
		"-qq",
		n,
		"-d",
		i
	]);
	return i;
}
async function _(n, r) {
	let i = t.resolve(r);
	if (await e.mkdir(t.dirname(i), { recursive: !0 }), await e.rm(i, { force: !0 }), process.platform === "win32") {
		let r = `${i}.zip`;
		await e.rm(r, { force: !0 }), await m("powershell.exe", [
			"-NoProfile",
			"-Command",
			`Compress-Archive -Path '${t.join(n, "*").replace(/'/g, "''")}' -DestinationPath '${r.replace(/'/g, "''")}' -Force`
		]), await e.rename(r, i);
		return;
	}
	await m("zip", [
		"-qr",
		i,
		"."
	], { cwd: n });
}
//#endregion
//#region electron/services/pptx.js
function v(e) {
	return e.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'");
}
function y(e) {
	return [...e.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((e) => v(e[1])).map((e) => e.trim()).filter(Boolean);
}
async function b(n) {
	let r = await g(n, "profe-pptx"), i = t.join(r, "ppt", "slides"), a = (await e.readdir(i)).filter((e) => /^slide\d+\.xml$/.test(e)).sort((e, t) => Number(e.match(/slide(\d+)\.xml$/)?.[1] ?? 0) - Number(t.match(/slide(\d+)\.xml$/)?.[1] ?? 0)), o = [];
	for (let n of a) {
		let r = y(await e.readFile(t.join(i, n), "utf8"));
		r.length > 0 && o.push({
			slide: Number(n.match(/slide(\d+)\.xml$/)?.[1] ?? 0),
			text: r.join(" ")
		});
	}
	return {
		slides: o,
		fullText: o.map((e) => `Slide ${e.slide}: ${e.text}`).join("\n")
	};
}
//#endregion
//#region node_modules/@xmldom/xmldom/lib/conventions.js
var x = /* @__PURE__ */ f(((e) => {
	function t(e, t, n) {
		if (n === void 0 && (n = Array.prototype), e && typeof n.find == "function") return n.find.call(e, t);
		for (var r = 0; r < e.length; r++) if (Object.prototype.hasOwnProperty.call(e, r)) {
			var i = e[r];
			if (t.call(void 0, i, r, e)) return i;
		}
	}
	function n(e, t) {
		return t === void 0 && (t = Object), t && typeof t.freeze == "function" ? t.freeze(e) : e;
	}
	function r(e, t) {
		if (typeof e != "object" || !e) throw TypeError("target is not an object");
		for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
		return e;
	}
	var i = n({
		HTML: "text/html",
		isHTML: function(e) {
			return e === i.HTML;
		},
		XML_APPLICATION: "application/xml",
		XML_TEXT: "text/xml",
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		XML_SVG_IMAGE: "image/svg+xml"
	}), a = n({
		HTML: "http://www.w3.org/1999/xhtml",
		isHTML: function(e) {
			return e === a.HTML;
		},
		SVG: "http://www.w3.org/2000/svg",
		XML: "http://www.w3.org/XML/1998/namespace",
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	e.assign = r, e.find = t, e.freeze = n, e.MIME_TYPE = i, e.NAMESPACE = a;
})), S = /* @__PURE__ */ f(((e) => {
	var t = x(), n = t.find, r = t.NAMESPACE;
	function i(e) {
		return e !== "";
	}
	function a(e) {
		return e ? e.split(/[\t\n\f\r ]+/).filter(i) : [];
	}
	function o(e, t) {
		return e.hasOwnProperty(t) || (e[t] = !0), e;
	}
	function s(e) {
		if (!e) return [];
		var t = a(e);
		return Object.keys(t.reduce(o, {}));
	}
	function c(e) {
		return function(t) {
			return e && e.indexOf(t) !== -1;
		};
	}
	function l(e, t) {
		for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	}
	function u(e, t) {
		var n = e.prototype;
		if (!(n instanceof t)) {
			function r() {}
			r.prototype = t.prototype, r = new r(), l(n, r), e.prototype = n = r;
		}
		n.constructor != e && (typeof e != "function" && console.error("unknown Class:" + e), n.constructor = e);
	}
	var d = {}, f = d.ELEMENT_NODE = 1, p = d.ATTRIBUTE_NODE = 2, m = d.TEXT_NODE = 3, h = d.CDATA_SECTION_NODE = 4, g = d.ENTITY_REFERENCE_NODE = 5, _ = d.ENTITY_NODE = 6, v = d.PROCESSING_INSTRUCTION_NODE = 7, y = d.COMMENT_NODE = 8, b = d.DOCUMENT_NODE = 9, S = d.DOCUMENT_TYPE_NODE = 10, C = d.DOCUMENT_FRAGMENT_NODE = 11, w = d.NOTATION_NODE = 12, T = {}, E = {};
	T.INDEX_SIZE_ERR = (E[1] = "Index size error", 1), T.DOMSTRING_SIZE_ERR = (E[2] = "DOMString size error", 2);
	var D = T.HIERARCHY_REQUEST_ERR = (E[3] = "Hierarchy request error", 3);
	T.WRONG_DOCUMENT_ERR = (E[4] = "Wrong document", 4);
	var O = T.INVALID_CHARACTER_ERR = (E[5] = "Invalid character", 5);
	T.NO_DATA_ALLOWED_ERR = (E[6] = "No data allowed", 6), T.NO_MODIFICATION_ALLOWED_ERR = (E[7] = "No modification allowed", 7);
	var k = T.NOT_FOUND_ERR = (E[8] = "Not found", 8);
	T.NOT_SUPPORTED_ERR = (E[9] = "Not supported", 9);
	var A = T.INUSE_ATTRIBUTE_ERR = (E[10] = "Attribute in use", 10), j = T.INVALID_STATE_ERR = (E[11] = "Invalid state", 11);
	T.SYNTAX_ERR = (E[12] = "Syntax error", 12), T.INVALID_MODIFICATION_ERR = (E[13] = "Invalid modification", 13), T.NAMESPACE_ERR = (E[14] = "Invalid namespace", 14), T.INVALID_ACCESS_ERR = (E[15] = "Invalid access", 15);
	function M(e, t) {
		if (t instanceof Error) var n = t;
		else n = this, Error.call(this, E[e]), this.message = E[e], Error.captureStackTrace && Error.captureStackTrace(this, M);
		return n.code = e, t && (this.message = this.message + ": " + t), n;
	}
	M.prototype = Error.prototype, l(T, M);
	function N() {}
	N.prototype = {
		length: 0,
		item: function(e) {
			return e >= 0 && e < this.length ? this[e] : null;
		},
		toString: function(e, t, n) {
			for (var r = !!n && !!n.requireWellFormed, i = [], a = 0; a < this.length; a++) Te(this[a], i, e, t, null, r);
			return i.join("");
		},
		filter: function(e) {
			return Array.prototype.filter.call(this, e);
		},
		indexOf: function(e) {
			return Array.prototype.indexOf.call(this, e);
		}
	};
	function P(e, t) {
		this._node = e, this._refresh = t, F(this);
	}
	function F(e) {
		var t = e._node._inc || e._node.ownerDocument._inc;
		if (e._inc !== t) {
			var n = e._refresh(e._node);
			if (Oe(e, "length", n.length), !e.$$length || n.length < e.$$length) for (var r = n.length; r in e; r++) Object.prototype.hasOwnProperty.call(e, r) && delete e[r];
			l(n, e), e._inc = t;
		}
	}
	P.prototype.item = function(e) {
		return F(this), this[e] || null;
	}, u(P, N);
	function I() {}
	function L(e, t) {
		for (var n = e.length; n--;) if (e[n] === t) return n;
	}
	function R(e, t, n, r) {
		if (r ? t[L(t, r)] = n : t[t.length++] = n, e) {
			n.ownerElement = e;
			var i = e.ownerDocument;
			i && (r && ie(i, e, r), re(i, e, n));
		}
	}
	function z(e, t, n) {
		var r = L(t, n);
		if (r >= 0) {
			for (var i = t.length - 1; r < i;) t[r] = t[++r];
			if (t.length = i, e) {
				var a = e.ownerDocument;
				a && (ie(a, e, n), n.ownerElement = null);
			}
		} else throw new M(k, /* @__PURE__ */ Error(e.tagName + "@" + n));
	}
	I.prototype = {
		length: 0,
		item: N.prototype.item,
		getNamedItem: function(e) {
			for (var t = this.length; t--;) {
				var n = this[t];
				if (n.nodeName == e) return n;
			}
		},
		setNamedItem: function(e) {
			var t = e.ownerElement;
			if (t && t != this._ownerElement) throw new M(A);
			var n = this.getNamedItem(e.nodeName);
			return R(this._ownerElement, this, e, n), n;
		},
		setNamedItemNS: function(e) {
			var t = e.ownerElement, n;
			if (t && t != this._ownerElement) throw new M(A);
			return n = this.getNamedItemNS(e.namespaceURI, e.localName), R(this._ownerElement, this, e, n), n;
		},
		removeNamedItem: function(e) {
			var t = this.getNamedItem(e);
			return z(this._ownerElement, this, t), t;
		},
		removeNamedItemNS: function(e, t) {
			var n = this.getNamedItemNS(e, t);
			return z(this._ownerElement, this, n), n;
		},
		getNamedItemNS: function(e, t) {
			for (var n = this.length; n--;) {
				var r = this[n];
				if (r.localName == t && r.namespaceURI == e) return r;
			}
			return null;
		}
	};
	function ee() {}
	ee.prototype = {
		hasFeature: function(e, t) {
			return !0;
		},
		createDocument: function(e, t, n) {
			var r = new ne();
			if (r.implementation = this, r.childNodes = new N(), r.doctype = n || null, n && r.appendChild(n), t) {
				var i = r.createElementNS(e, t);
				r.appendChild(i);
			}
			return r;
		},
		createDocumentType: function(e, t, n) {
			var r = new ve();
			return r.name = e, r.nodeName = e, r.publicId = t || "", r.systemId = n || "", r;
		}
	};
	function B() {}
	B.prototype = {
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
		insertBefore: function(e, t) {
			return Y(this, e, t);
		},
		replaceChild: function(e, t) {
			Y(this, e, t, ue), t && this.removeChild(t);
		},
		removeChild: function(e) {
			return U(this, e);
		},
		appendChild: function(e) {
			return this.insertBefore(e, null);
		},
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		cloneNode: function(e) {
			return De(this.ownerDocument || this, this, e);
		},
		normalize: function() {
			H(this, null, { enter: function(e) {
				for (var t = e.firstChild; t;) {
					var n = t.nextSibling;
					n !== null && n.nodeType === m && t.nodeType === m ? (e.removeChild(n), t.appendData(n.data)) : t = n;
				}
				return !0;
			} });
		},
		isSupported: function(e, t) {
			return this.ownerDocument.implementation.hasFeature(e, t);
		},
		hasAttributes: function() {
			return this.attributes.length > 0;
		},
		lookupPrefix: function(e) {
			for (var t = this; t;) {
				var n = t._nsMap;
				if (n) {
					for (var r in n) if (Object.prototype.hasOwnProperty.call(n, r) && n[r] === e) return r;
				}
				t = t.nodeType == p ? t.ownerDocument : t.parentNode;
			}
			return null;
		},
		lookupNamespaceURI: function(e) {
			for (var t = this; t;) {
				var n = t._nsMap;
				if (n && Object.prototype.hasOwnProperty.call(n, e)) return n[e];
				t = t.nodeType == p ? t.ownerDocument : t.parentNode;
			}
			return null;
		},
		isDefaultNamespace: function(e) {
			return this.lookupPrefix(e) == null;
		}
	};
	function te(e) {
		return e == "<" && "&lt;" || e == ">" && "&gt;" || e == "&" && "&amp;" || e == "\"" && "&quot;" || "&#" + e.charCodeAt() + ";";
	}
	l(d, B), l(d, B.prototype);
	function V(e, t) {
		return H(e, null, { enter: function(e) {
			return t(e) ? H.STOP : !0;
		} }) === H.STOP;
	}
	function H(e, t, n) {
		for (var r = [{
			node: e,
			context: t,
			phase: H.ENTER
		}]; r.length > 0;) {
			var i = r.pop();
			if (i.phase === H.ENTER) {
				var a = n.enter(i.node, i.context);
				if (a === H.STOP) return H.STOP;
				if (r.push({
					node: i.node,
					context: a,
					phase: H.EXIT
				}), a == null) continue;
				for (var o = i.node.lastChild; o;) r.push({
					node: o,
					context: a,
					phase: H.ENTER
				}), o = o.previousSibling;
			} else n.exit && n.exit(i.node, i.context);
		}
	}
	H.STOP = Symbol("walkDOM.STOP"), H.ENTER = 0, H.EXIT = 1;
	function ne() {
		this.ownerDocument = this;
	}
	function re(e, t, n) {
		e && e._inc++, n.namespaceURI === r.XMLNS && (t._nsMap[n.prefix ? n.localName : ""] = n.value);
	}
	function ie(e, t, n, i) {
		e && e._inc++, n.namespaceURI === r.XMLNS && delete t._nsMap[n.prefix ? n.localName : ""];
	}
	function ae(e, t, n) {
		if (e && e._inc) {
			e._inc++;
			var r = t.childNodes;
			if (n) r[r.length++] = n;
			else {
				for (var i = t.firstChild, a = 0; i;) r[a++] = i, i = i.nextSibling;
				r.length = a, delete r[r.length];
			}
		}
	}
	function U(e, t) {
		var n = t.previousSibling, r = t.nextSibling;
		return n ? n.nextSibling = r : e.firstChild = r, r ? r.previousSibling = n : e.lastChild = n, t.parentNode = null, t.previousSibling = null, t.nextSibling = null, ae(e.ownerDocument, e), t;
	}
	function oe(e) {
		return e && (e.nodeType === B.DOCUMENT_NODE || e.nodeType === B.DOCUMENT_FRAGMENT_NODE || e.nodeType === B.ELEMENT_NODE);
	}
	function se(e) {
		return e && (G(e) || K(e) || W(e) || e.nodeType === B.DOCUMENT_FRAGMENT_NODE || e.nodeType === B.COMMENT_NODE || e.nodeType === B.PROCESSING_INSTRUCTION_NODE);
	}
	function W(e) {
		return e && e.nodeType === B.DOCUMENT_TYPE_NODE;
	}
	function G(e) {
		return e && e.nodeType === B.ELEMENT_NODE;
	}
	function K(e) {
		return e && e.nodeType === B.TEXT_NODE;
	}
	function q(e, t) {
		var r = e.childNodes || [];
		if (n(r, G) || W(t)) return !1;
		var i = n(r, W);
		return !(t && i && r.indexOf(i) > r.indexOf(t));
	}
	function ce(e, t) {
		var r = e.childNodes || [];
		function i(e) {
			return G(e) && e !== t;
		}
		if (n(r, i)) return !1;
		var a = n(r, W);
		return !(t && a && r.indexOf(a) > r.indexOf(t));
	}
	function J(e, t, n) {
		if (!oe(e)) throw new M(D, "Unexpected parent node type " + e.nodeType);
		if (n && n.parentNode !== e) throw new M(k, "child not in parent");
		if (!se(t) || W(t) && e.nodeType !== B.DOCUMENT_NODE) throw new M(D, "Unexpected node type " + t.nodeType + " for parent node type " + e.nodeType);
	}
	function le(e, t, r) {
		var i = e.childNodes || [], a = t.childNodes || [];
		if (t.nodeType === B.DOCUMENT_FRAGMENT_NODE) {
			var o = a.filter(G);
			if (o.length > 1 || n(a, K)) throw new M(D, "More than one element or text in fragment");
			if (o.length === 1 && !q(e, r)) throw new M(D, "Element in fragment can not be inserted before doctype");
		}
		if (G(t) && !q(e, r)) throw new M(D, "Only one element can be added and only after doctype");
		if (W(t)) {
			if (n(i, W)) throw new M(D, "Only one doctype is allowed");
			var s = n(i, G);
			if (r && i.indexOf(s) < i.indexOf(r)) throw new M(D, "Doctype can only be inserted before an element");
			if (!r && s) throw new M(D, "Doctype can not be appended since element is present");
		}
	}
	function ue(e, t, r) {
		var i = e.childNodes || [], a = t.childNodes || [];
		if (t.nodeType === B.DOCUMENT_FRAGMENT_NODE) {
			var o = a.filter(G);
			if (o.length > 1 || n(a, K)) throw new M(D, "More than one element or text in fragment");
			if (o.length === 1 && !ce(e, r)) throw new M(D, "Element in fragment can not be inserted before doctype");
		}
		if (G(t) && !ce(e, r)) throw new M(D, "Only one element can be added and only after doctype");
		if (W(t)) {
			function e(e) {
				return W(e) && e !== r;
			}
			if (n(i, e)) throw new M(D, "Only one doctype is allowed");
			var s = n(i, G);
			if (r && i.indexOf(s) < i.indexOf(r)) throw new M(D, "Doctype can only be inserted before an element");
		}
	}
	function Y(e, t, n, r) {
		J(e, t, n), e.nodeType === B.DOCUMENT_NODE && (r || le)(e, t, n);
		var i = t.parentNode;
		if (i && i.removeChild(t), t.nodeType === C) {
			var a = t.firstChild;
			if (a == null) return t;
			var o = t.lastChild;
		} else a = o = t;
		var s = n ? n.previousSibling : e.lastChild;
		a.previousSibling = s, o.nextSibling = n, s ? s.nextSibling = a : e.firstChild = a, n == null ? e.lastChild = o : n.previousSibling = o;
		do {
			a.parentNode = e;
			var c = e.ownerDocument || e;
			de(a, c);
		} while (a !== o && (a = a.nextSibling));
		return ae(e.ownerDocument || e, e), t.nodeType == C && (t.firstChild = t.lastChild = null), t;
	}
	function de(e, t) {
		if (e.ownerDocument !== t) {
			if (e.ownerDocument = t, e.nodeType === f && e.attributes) for (var n = 0; n < e.attributes.length; n++) {
				var r = e.attributes.item(n);
				r && (r.ownerDocument = t);
			}
			for (var i = e.firstChild; i;) de(i, t), i = i.nextSibling;
		}
	}
	function fe(e, t) {
		return t.parentNode && t.parentNode.removeChild(t), t.parentNode = e, t.previousSibling = e.lastChild, t.nextSibling = null, t.previousSibling ? t.previousSibling.nextSibling = t : e.firstChild = t, e.lastChild = t, ae(e.ownerDocument, e, t), de(t, e.ownerDocument || e), t;
	}
	ne.prototype = {
		nodeName: "#document",
		nodeType: b,
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(e, t) {
			if (e.nodeType == C) {
				for (var n = e.firstChild; n;) {
					var r = n.nextSibling;
					this.insertBefore(n, t), n = r;
				}
				return e;
			}
			return Y(this, e, t), de(e, this), this.documentElement === null && e.nodeType === f && (this.documentElement = e), e;
		},
		removeChild: function(e) {
			return this.documentElement == e && (this.documentElement = null), U(this, e);
		},
		replaceChild: function(e, t) {
			Y(this, e, t, ue), de(e, this), t && this.removeChild(t), G(e) && (this.documentElement = e);
		},
		importNode: function(e, t) {
			return Ee(this, e, t);
		},
		getElementById: function(e) {
			var t = null;
			return V(this.documentElement, function(n) {
				if (n.nodeType == f && n.getAttribute("id") == e) return t = n, !0;
			}), t;
		},
		getElementsByClassName: function(e) {
			var t = s(e);
			return new P(this, function(n) {
				var r = [];
				return t.length > 0 && V(n.documentElement, function(i) {
					if (i !== n && i.nodeType === f) {
						var a = i.getAttribute("class");
						if (a) {
							var o = e === a;
							if (!o) {
								var l = s(a);
								o = t.every(c(l));
							}
							o && r.push(i);
						}
					}
				}), r;
			});
		},
		createElement: function(e) {
			var t = new X();
			t.ownerDocument = this, t.nodeName = e, t.tagName = e, t.localName = e, t.childNodes = new N();
			var n = t.attributes = new I();
			return n._ownerElement = t, t;
		},
		createDocumentFragment: function() {
			var e = new be();
			return e.ownerDocument = this, e.childNodes = new N(), e;
		},
		createTextNode: function(e) {
			var t = new he();
			return t.ownerDocument = this, t.appendData(e), t;
		},
		createComment: function(e) {
			var t = new ge();
			return t.ownerDocument = this, t.appendData(e), t;
		},
		createCDATASection: function(e) {
			if (e.indexOf("]]>") !== -1) throw new M(O, "data contains \"]]>\"");
			var t = new _e();
			return t.ownerDocument = this, t.appendData(e), t;
		},
		createProcessingInstruction: function(e, t) {
			var n = new xe();
			return n.ownerDocument = this, n.tagName = n.nodeName = n.target = e, n.nodeValue = n.data = t, n;
		},
		createAttribute: function(e) {
			var t = new pe();
			return t.ownerDocument = this, t.name = e, t.nodeName = e, t.localName = e, t.specified = !0, t;
		},
		createEntityReference: function(e) {
			var t = new Q();
			return t.ownerDocument = this, t.nodeName = e, t;
		},
		createElementNS: function(e, t) {
			var n = new X(), r = t.split(":"), i = n.attributes = new I();
			return n.childNodes = new N(), n.ownerDocument = this, n.nodeName = t, n.tagName = t, n.namespaceURI = e, r.length == 2 ? (n.prefix = r[0], n.localName = r[1]) : n.localName = t, i._ownerElement = n, n;
		},
		createAttributeNS: function(e, t) {
			var n = new pe(), r = t.split(":");
			return n.ownerDocument = this, n.nodeName = t, n.name = t, n.namespaceURI = e, n.specified = !0, r.length == 2 ? (n.prefix = r[0], n.localName = r[1]) : n.localName = t, n;
		}
	}, u(ne, B);
	function X() {
		this._nsMap = {};
	}
	X.prototype = {
		nodeType: f,
		hasAttribute: function(e) {
			return this.getAttributeNode(e) != null;
		},
		getAttribute: function(e) {
			var t = this.getAttributeNode(e);
			return t && t.value || "";
		},
		getAttributeNode: function(e) {
			return this.attributes.getNamedItem(e);
		},
		setAttribute: function(e, t) {
			var n = this.ownerDocument.createAttribute(e);
			n.value = n.nodeValue = "" + t, this.setAttributeNode(n);
		},
		removeAttribute: function(e) {
			var t = this.getAttributeNode(e);
			t && this.removeAttributeNode(t);
		},
		appendChild: function(e) {
			return e.nodeType === C ? this.insertBefore(e, null) : fe(this, e);
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
		removeAttributeNS: function(e, t) {
			var n = this.getAttributeNodeNS(e, t);
			n && this.removeAttributeNode(n);
		},
		hasAttributeNS: function(e, t) {
			return this.getAttributeNodeNS(e, t) != null;
		},
		getAttributeNS: function(e, t) {
			var n = this.getAttributeNodeNS(e, t);
			return n && n.value || "";
		},
		setAttributeNS: function(e, t, n) {
			var r = this.ownerDocument.createAttributeNS(e, t);
			r.value = r.nodeValue = "" + n, this.setAttributeNode(r);
		},
		getAttributeNodeNS: function(e, t) {
			return this.attributes.getNamedItemNS(e, t);
		},
		getElementsByTagName: function(e) {
			return new P(this, function(t) {
				var n = [];
				return V(t, function(r) {
					r !== t && r.nodeType == f && (e === "*" || r.tagName == e) && n.push(r);
				}), n;
			});
		},
		getElementsByTagNameNS: function(e, t) {
			return new P(this, function(n) {
				var r = [];
				return V(n, function(i) {
					i !== n && i.nodeType === f && (e === "*" || i.namespaceURI === e) && (t === "*" || i.localName == t) && r.push(i);
				}), r;
			});
		}
	}, ne.prototype.getElementsByTagName = X.prototype.getElementsByTagName, ne.prototype.getElementsByTagNameNS = X.prototype.getElementsByTagNameNS, u(X, B);
	function pe() {}
	pe.prototype.nodeType = p, u(pe, B);
	function me() {}
	me.prototype = {
		data: "",
		substringData: function(e, t) {
			return this.data.substring(e, e + t);
		},
		appendData: function(e) {
			e = this.data + e, this.nodeValue = this.data = e, this.length = e.length;
		},
		insertData: function(e, t) {
			this.replaceData(e, 0, t);
		},
		appendChild: function(e) {
			throw Error(E[D]);
		},
		deleteData: function(e, t) {
			this.replaceData(e, t, "");
		},
		replaceData: function(e, t, n) {
			var r = this.data.substring(0, e), i = this.data.substring(e + t);
			n = r + n + i, this.nodeValue = this.data = n, this.length = n.length;
		}
	}, u(me, B);
	function he() {}
	he.prototype = {
		nodeName: "#text",
		nodeType: m,
		splitText: function(e) {
			var t = this.data, n = t.substring(e);
			t = t.substring(0, e), this.data = this.nodeValue = t, this.length = t.length;
			var r = this.ownerDocument.createTextNode(n);
			return this.parentNode && this.parentNode.insertBefore(r, this.nextSibling), r;
		}
	}, u(he, me);
	function ge() {}
	ge.prototype = {
		nodeName: "#comment",
		nodeType: y
	}, u(ge, me);
	function _e() {}
	_e.prototype = {
		nodeName: "#cdata-section",
		nodeType: h
	}, u(_e, me);
	function ve() {}
	ve.prototype.nodeType = S, u(ve, B);
	function ye() {}
	ye.prototype.nodeType = w, u(ye, B);
	function Z() {}
	Z.prototype.nodeType = _, u(Z, B);
	function Q() {}
	Q.prototype.nodeType = g, u(Q, B);
	function be() {}
	be.prototype.nodeName = "#document-fragment", be.prototype.nodeType = C, u(be, B);
	function xe() {}
	xe.prototype.nodeType = v, u(xe, B);
	function Se() {}
	Se.prototype.serializeToString = function(e, t, n, r) {
		return Ce.call(e, t, n, r);
	}, B.prototype.toString = Ce;
	function Ce(e, t, n) {
		var r = !!n && !!n.requireWellFormed, i = [], a = this.nodeType == 9 && this.documentElement || this, o = a.prefix, s = a.namespaceURI;
		if (s && o == null) {
			var o = a.lookupPrefix(s);
			if (o == null) var c = [{
				namespace: s,
				prefix: null
			}];
		}
		return Te(this, i, e, t, c, r), i.join("");
	}
	function we(e, t, n) {
		var i = e.prefix || "", a = e.namespaceURI;
		if (!a || i === "xml" && a === r.XML || a === r.XMLNS) return !1;
		for (var o = n.length; o--;) {
			var s = n[o];
			if (s.prefix === i) return s.namespace !== a;
		}
		return !0;
	}
	function $(e, t, n) {
		e.push(" ", t, "=\"", n.replace(/[<>&"\t\n\r]/g, te), "\"");
	}
	function Te(e, t, n, i, a, o) {
		a ||= [], H(e, {
			ns: a,
			isHTML: n
		}, {
			enter: function(e, n) {
				var a = n.ns, s = n.isHTML;
				if (i) if (e = i(e), e) {
					if (typeof e == "string") return t.push(e), null;
				} else return null;
				switch (e.nodeType) {
					case f:
						var c = e.attributes, l = c.length, u = e.tagName;
						s = r.isHTML(e.namespaceURI) || s;
						var d = u;
						if (!s && !e.prefix && e.namespaceURI) {
							for (var _, x = 0; x < c.length; x++) if (c.item(x).name === "xmlns") {
								_ = c.item(x).value;
								break;
							}
							if (!_) for (var w = a.length - 1; w >= 0; w--) {
								var T = a[w];
								if (T.prefix === "" && T.namespace === e.namespaceURI) {
									_ = T.namespace;
									break;
								}
							}
							if (_ !== e.namespaceURI) for (var w = a.length - 1; w >= 0; w--) {
								var T = a[w];
								if (T.namespace === e.namespaceURI) {
									T.prefix && (d = T.prefix + ":" + u);
									break;
								}
							}
						}
						t.push("<", d);
						for (var E = a.slice(), D = 0; D < l; D++) {
							var O = c.item(D);
							O.prefix == "xmlns" ? E.push({
								prefix: O.localName,
								namespace: O.value
							}) : O.nodeName == "xmlns" && E.push({
								prefix: "",
								namespace: O.value
							});
						}
						for (var D = 0; D < l; D++) {
							var O = c.item(D);
							if (we(O, s, E)) {
								var k = O.prefix || "", A = O.namespaceURI;
								$(t, k ? "xmlns:" + k : "xmlns", A), E.push({
									prefix: k,
									namespace: A
								});
							}
							var N = i ? i(O) : O;
							N && (typeof N == "string" ? t.push(N) : $(t, N.name, N.value));
						}
						if (u === d && we(e, s, E)) {
							var P = e.prefix || "", A = e.namespaceURI;
							$(t, P ? "xmlns:" + P : "xmlns", A), E.push({
								prefix: P,
								namespace: A
							});
						}
						var F = e.firstChild;
						if (F || s && !/^(?:meta|link|img|br|hr|input)$/i.test(u)) {
							if (t.push(">"), s && /^script$/i.test(u)) {
								for (; F;) F.data ? t.push(F.data) : Te(F, t, s, i, E.slice(), o), F = F.nextSibling;
								return t.push("</", u, ">"), null;
							}
							return {
								ns: E,
								isHTML: s,
								tag: d
							};
						} else return t.push("/>"), null;
					case b:
					case C: return {
						ns: a.slice(),
						isHTML: s,
						tag: null
					};
					case p: return $(t, e.name, e.value), null;
					case m: return t.push(e.data.replace(/[<&>]/g, te)), null;
					case h:
						if (o && e.data.indexOf("]]>") !== -1) throw new M(j, "The CDATASection data contains \"]]>\"");
						return t.push("<![CDATA[", e.data.replace(/]]>/g, "]]]]><![CDATA[>"), "]]>"), null;
					case y:
						if (o && e.data.indexOf("-->") !== -1) throw new M(j, "The comment node data contains \"-->\"");
						return t.push("<!--", e.data, "-->"), null;
					case S:
						if (o) {
							if (e.publicId && !/^("[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%']*"|'[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%'"]*')$/.test(e.publicId)) throw new M(j, "DocumentType publicId is not a valid PubidLiteral");
							if (e.systemId && !/^("[^"]*"|'[^']*')$/.test(e.systemId)) throw new M(j, "DocumentType systemId is not a valid SystemLiteral");
							if (e.internalSubset && e.internalSubset.indexOf("]>") !== -1) throw new M(j, "DocumentType internalSubset contains \"]>\"");
						}
						var I = e.publicId, L = e.systemId;
						if (t.push("<!DOCTYPE ", e.name), I) t.push(" PUBLIC ", I), L && L != "." && t.push(" ", L), t.push(">");
						else if (L && L != ".") t.push(" SYSTEM ", L, ">");
						else {
							var R = e.internalSubset;
							R && t.push(" [", R, "]"), t.push(">");
						}
						return null;
					case v:
						if (o && e.data.indexOf("?>") !== -1) throw new M(j, "The ProcessingInstruction data contains \"?>\"");
						return t.push("<?", e.target, " ", e.data, "?>"), null;
					case g: return t.push("&", e.nodeName, ";"), null;
					default: return t.push("??", e.nodeName), null;
				}
			},
			exit: function(e, n) {
				n && n.tag && t.push("</", n.tag, ">");
			}
		});
	}
	function Ee(e, t, n) {
		var r;
		return H(t, null, { enter: function(t, i) {
			var a = t.cloneNode(!1);
			return a.ownerDocument = e, a.parentNode = null, i === null ? r = a : i.appendChild(a), t.nodeType === p || n ? a : null;
		} }), r;
	}
	function De(e, t, n) {
		var r;
		return H(t, null, { enter: function(t, i) {
			var a = new t.constructor();
			for (var o in t) if (Object.prototype.hasOwnProperty.call(t, o)) {
				var s = t[o];
				typeof s != "object" && s != a[o] && (a[o] = s);
			}
			t.childNodes && (a.childNodes = new N()), a.ownerDocument = e;
			var c = n;
			switch (a.nodeType) {
				case f:
					var l = t.attributes, u = a.attributes = new I(), d = l.length;
					u._ownerElement = a;
					for (var m = 0; m < d; m++) a.setAttributeNode(De(e, l.item(m), !0));
					break;
				case p: c = !0;
			}
			return i === null ? r = a : i.appendChild(a), c ? a : null;
		} }), r;
	}
	function Oe(e, t, n) {
		e[t] = n;
	}
	try {
		Object.defineProperty && (Object.defineProperty(P.prototype, "length", { get: function() {
			return F(this), this.$$length;
		} }), Object.defineProperty(B.prototype, "textContent", {
			get: function() {
				if (this.nodeType === f || this.nodeType === C) {
					var e = [];
					return H(this, null, { enter: function(t) {
						if (t.nodeType === f || t.nodeType === C) return !0;
						if (t.nodeType === v || t.nodeType === y) return null;
						e.push(t.nodeValue);
					} }), e.join("");
				}
				return this.nodeValue;
			},
			set: function(e) {
				switch (this.nodeType) {
					case f:
					case C:
						for (; this.firstChild;) this.removeChild(this.firstChild);
						(e || String(e)) && this.appendChild(this.ownerDocument.createTextNode(e));
						break;
					default: this.data = e, this.value = e, this.nodeValue = e;
				}
			}
		}), Oe = function(e, t, n) {
			e["$$" + t] = n;
		});
	} catch {}
	e.DocumentType = ve, e.DOMException = M, e.DOMImplementation = ee, e.Element = X, e.Node = B, e.NodeList = N, e.walkDOM = H, e.XMLSerializer = Se;
})), C = /* @__PURE__ */ f(((e) => {
	var t = x().freeze;
	e.XML_ENTITIES = t({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	}), e.HTML_ENTITIES = t({
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
		nbsp: "\xA0",
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
		NewLine: "\n",
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
		NonBreakingSpace: "\xA0",
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
		QUOT: "\"",
		quot: "\"",
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
	}), e.entityMap = e.HTML_ENTITIES;
})), w = /* @__PURE__ */ f(((e) => {
	var t = x().NAMESPACE, n = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, r = RegExp("[\\-\\.0-9" + n.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"), i = RegExp("^" + n.source + r.source + "*(?::" + n.source + r.source + "*)?$"), a = 0, o = 1, s = 2, c = 3, l = 4, u = 5, d = 6, f = 7;
	function p(e, t) {
		this.message = e, this.locator = t, Error.captureStackTrace && Error.captureStackTrace(this, p);
	}
	p.prototype = /* @__PURE__ */ Error(), p.prototype.name = p.name;
	function m() {}
	m.prototype = { parse: function(e, t, n) {
		var r = this.domBuilder;
		r.startDocument(), S(t, t = {}), h(e, t, n, r, this.errorHandler), r.endDocument();
	} };
	function h(e, n, r, i, a) {
		function o(e) {
			if (e > 65535) {
				e -= 65536;
				var t = 55296 + (e >> 10), n = 56320 + (e & 1023);
				return String.fromCharCode(t, n);
			} else return String.fromCharCode(e);
		}
		function s(e) {
			var t = e.slice(1, -1);
			return Object.hasOwnProperty.call(r, t) ? r[t] : t.charAt(0) === "#" ? o(parseInt(t.substr(1).replace("x", "0x"))) : (a.error("entity not found:" + e), e);
		}
		function c(t) {
			if (t > S) {
				var n = e.substring(S, t).replace(/&#?\w+;/g, s);
				m && l(S), i.characters(n, 0, t - S), S = t;
			}
		}
		function l(t, n) {
			for (; t >= d && (n = f.exec(e));) u = n.index, d = u + n[0].length, m.lineNumber++;
			m.columnNumber = t - u + 1;
		}
		for (var u = 0, d = 0, f = /.*(?:\r\n?|\n)|.*$/g, m = i.locator, h = [{ currentNSMap: n }], x = {}, S = 0;;) {
			try {
				var E = e.indexOf("<", S);
				if (E < 0) {
					if (!e.substr(S).match(/^\s*$/)) {
						var D = i.doc, O = D.createTextNode(e.substr(S));
						D.appendChild(O), i.currentElement = O;
					}
					return;
				}
				switch (E > S && c(E), e.charAt(E + 1)) {
					case "/":
						var k = e.indexOf(">", E + 3), A = e.substring(E + 2, k).replace(/[ \t\n\r]+$/g, ""), j = h.pop();
						k < 0 ? (A = e.substring(E + 2).replace(/[\s<].*/, ""), a.error("end tag name: " + A + " is not complete:" + j.tagName), k = E + 1 + A.length) : A.match(/\s</) && (A = A.replace(/[\s<].*/, ""), a.error("end tag name: " + A + " maybe not complete"), k = E + 1 + A.length);
						var M = j.localNSMap, N = j.tagName == A;
						if (N || j.tagName && j.tagName.toLowerCase() == A.toLowerCase()) {
							if (i.endElement(j.uri, j.localName, A), M) for (var P in M) Object.prototype.hasOwnProperty.call(M, P) && i.endPrefixMapping(P);
							N || a.fatalError("end tag name: " + A + " is not match the current start tagName:" + j.tagName);
						} else h.push(j);
						k++;
						break;
					case "?":
						m && l(E), k = w(e, E, i);
						break;
					case "!":
						m && l(E), k = C(e, E, i, a);
						break;
					default:
						m && l(E);
						var F = new T(), I = h[h.length - 1].currentNSMap, k = _(e, E, F, I, s, a), L = F.length;
						if (!F.closed && b(e, k, F.tagName, x) && (F.closed = !0, r.nbsp || a.warning("unclosed xml attribute")), m && L) {
							for (var R = g(m, {}), z = 0; z < L; z++) {
								var ee = F[z];
								l(ee.offset), ee.locator = g(m, {});
							}
							i.locator = R, v(F, i, I) && h.push(F), i.locator = m;
						} else v(F, i, I) && h.push(F);
						t.isHTML(F.uri) && !F.closed ? k = y(e, k, F.tagName, s, i) : k++;
				}
			} catch (e) {
				if (e instanceof p) throw e;
				a.error("element parse error: " + e), k = -1;
			}
			k > S ? S = k : c(Math.max(E, S) + 1);
		}
	}
	function g(e, t) {
		return t.lineNumber = e.lineNumber, t.columnNumber = e.columnNumber, t;
	}
	function _(e, n, r, i, p, m) {
		function h(e, t, n) {
			r.attributeNames.hasOwnProperty(e) && m.fatalError("Attribute " + e + " redefined"), r.addValue(e, t.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, p), n);
		}
		for (var g, _, v = ++n, y = a;;) {
			var b = e.charAt(v);
			switch (b) {
				case "=":
					if (y === o) g = e.slice(n, v), y = c;
					else if (y === s) y = c;
					else throw Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (y === c || y === o) if (y === o && (m.warning("attribute value must after \"=\""), g = e.slice(n, v)), n = v + 1, v = e.indexOf(b, n), v > 0) _ = e.slice(n, v), h(g, _, n - 1), y = u;
					else throw Error("attribute value no end '" + b + "' match");
					else if (y == l) _ = e.slice(n, v), h(g, _, n), m.warning("attribute \"" + g + "\" missed start quot(" + b + ")!!"), n = v + 1, y = u;
					else throw Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (y) {
						case a: r.setTagName(e.slice(n, v));
						case u:
						case d:
						case f: y = f, r.closed = !0;
						case l:
						case o: break;
						case s:
							r.closed = !0;
							break;
						default: throw Error("attribute invalid close char('/')");
					}
					break;
				case "": return m.error("unexpected end of input"), y == a && r.setTagName(e.slice(n, v)), v;
				case ">":
					switch (y) {
						case a: r.setTagName(e.slice(n, v));
						case u:
						case d:
						case f: break;
						case l:
						case o: _ = e.slice(n, v), _.slice(-1) === "/" && (r.closed = !0, _ = _.slice(0, -1));
						case s:
							y === s && (_ = g), y == l ? (m.warning("attribute \"" + _ + "\" missed quot(\")!"), h(g, _, n)) : ((!t.isHTML(i[""]) || !_.match(/^(?:disabled|checked|selected)$/i)) && m.warning("attribute \"" + _ + "\" missed value!! \"" + _ + "\" instead!!"), h(_, _, n));
							break;
						case c: throw Error("attribute value missed!!");
					}
					return v;
				case "": b = " ";
				default: if (b <= " ") switch (y) {
					case a:
						r.setTagName(e.slice(n, v)), y = d;
						break;
					case o:
						g = e.slice(n, v), y = s;
						break;
					case l:
						var _ = e.slice(n, v);
						m.warning("attribute \"" + _ + "\" missed quot(\")!!"), h(g, _, n);
					case u:
						y = d;
						break;
				}
				else switch (y) {
					case s:
						r.tagName, (!t.isHTML(i[""]) || !g.match(/^(?:disabled|checked|selected)$/i)) && m.warning("attribute \"" + g + "\" missed value!! \"" + g + "\" instead2!!"), h(g, g, n), n = v, y = o;
						break;
					case u: m.warning("attribute space is required\"" + g + "\"!!");
					case d:
						y = o, n = v;
						break;
					case c:
						y = l, n = v;
						break;
					case f: throw Error("elements closed character '/' and '>' must be connected to");
				}
			}
			v++;
		}
	}
	function v(e, n, r) {
		for (var i = e.tagName, a = null, o = e.length; o--;) {
			var s = e[o], c = s.qName, l = s.value, u = c.indexOf(":");
			if (u > 0) var d = s.prefix = c.slice(0, u), f = c.slice(u + 1), p = d === "xmlns" && f;
			else f = c, d = null, p = c === "xmlns" && "";
			s.localName = f, p !== !1 && (a ?? (a = {}, S(r, r = {})), r[p] = a[p] = l, s.uri = t.XMLNS, n.startPrefixMapping(p, l));
		}
		for (var o = e.length; o--;) {
			s = e[o];
			var d = s.prefix;
			d && (d === "xml" && (s.uri = t.XML), d !== "xmlns" && (s.uri = r[d || ""]));
		}
		var u = i.indexOf(":");
		u > 0 ? (d = e.prefix = i.slice(0, u), f = e.localName = i.slice(u + 1)) : (d = null, f = e.localName = i);
		var m = e.uri = r[d || ""];
		if (n.startElement(m, f, i, e), e.closed) {
			if (n.endElement(m, f, i), a) for (d in a) Object.prototype.hasOwnProperty.call(a, d) && n.endPrefixMapping(d);
		} else return e.currentNSMap = r, e.localNSMap = a, !0;
	}
	function y(e, t, n, r, i) {
		if (/^(?:script|textarea)$/i.test(n)) {
			var a = e.indexOf("</" + n + ">", t), o = e.substring(t + 1, a);
			if (/[&<]/.test(o)) return /^script$/i.test(n) ? (i.characters(o, 0, o.length), a) : (o = o.replace(/&#?\w+;/g, r), i.characters(o, 0, o.length), a);
		}
		return t + 1;
	}
	function b(e, t, n, r) {
		var i = r[n];
		return i ?? (i = e.lastIndexOf("</" + n + ">"), i < t && (i = e.lastIndexOf("</" + n)), r[n] = i), i < t;
	}
	function S(e, t) {
		for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	}
	function C(e, t, n, r) {
		switch (e.charAt(t + 2)) {
			case "-": if (e.charAt(t + 3) === "-") {
				var i = e.indexOf("-->", t + 4);
				return i > t ? (n.comment(e, t + 4, i - t - 4), i + 3) : (r.error("Unclosed comment"), -1);
			} else return -1;
			default:
				if (e.substr(t + 3, 6) == "CDATA[") {
					var i = e.indexOf("]]>", t + 9);
					return n.startCDATA(), n.characters(e, t + 9, i - t - 9), n.endCDATA(), i + 3;
				}
				var a = E(e, t), o = a.length;
				if (o > 1 && /!doctype/i.test(a[0][0])) {
					var s = a[1][0], c = !1, l = !1;
					o > 3 && (/^public$/i.test(a[2][0]) ? (c = a[3][0], l = o > 4 && a[4][0]) : /^system$/i.test(a[2][0]) && (l = a[3][0]));
					var u = a[o - 1];
					return n.startDTD(s, c, l), n.endDTD(), u.index + u[0].length;
				}
		}
		return -1;
	}
	function w(e, t, n) {
		var r = e.indexOf("?>", t);
		if (r) {
			var i = e.substring(t, r).match(/^<\?(\S*)\s*([\s\S]*?)$/);
			return i ? (i[0].length, n.processingInstruction(i[1], i[2]), r + 2) : -1;
		}
		return -1;
	}
	function T() {
		this.attributeNames = {};
	}
	T.prototype = {
		setTagName: function(e) {
			if (!i.test(e)) throw Error("invalid tagName:" + e);
			this.tagName = e;
		},
		addValue: function(e, t, n) {
			if (!i.test(e)) throw Error("invalid attribute:" + e);
			this.attributeNames[e] = this.length, this[this.length++] = {
				qName: e,
				value: t,
				offset: n
			};
		},
		length: 0,
		getLocalName: function(e) {
			return this[e].localName;
		},
		getLocator: function(e) {
			return this[e].locator;
		},
		getQName: function(e) {
			return this[e].qName;
		},
		getURI: function(e) {
			return this[e].uri;
		},
		getValue: function(e) {
			return this[e].value;
		}
	};
	function E(e, t) {
		var n, r = [], i = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		for (i.lastIndex = t, i.exec(e); n = i.exec(e);) if (r.push(n), n[1]) return r;
	}
	e.XMLReader = m, e.ParseError = p;
})), T = /* @__PURE__ */ f(((e) => {
	var t = x(), n = S(), r = C(), i = w(), a = n.DOMImplementation, o = t.NAMESPACE, s = i.ParseError, c = i.XMLReader;
	function l(e) {
		return e.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
	}
	function u(e) {
		this.options = e || { locator: {} };
	}
	u.prototype.parseFromString = function(e, t) {
		var n = this.options, i = new c(), a = n.domBuilder || new f(), s = n.errorHandler, u = n.locator, p = n.xmlns || {}, m = /\/x?html?$/.test(t), h = m ? r.HTML_ENTITIES : r.XML_ENTITIES;
		u && a.setDocumentLocator(u), i.errorHandler = d(s, a, u), i.domBuilder = n.domBuilder || a, m && (p[""] = o.HTML), p.xml = p.xml || o.XML;
		var g = n.normalizeLineEndings || l;
		return e && typeof e == "string" ? i.parse(g(e), p, h) : i.errorHandler.error("invalid doc source"), a.doc;
	};
	function d(e, t, n) {
		if (!e) {
			if (t instanceof f) return t;
			e = t;
		}
		var r = {}, i = e instanceof Function;
		n ||= {};
		function a(t) {
			var a = e[t];
			!a && i && (a = e.length == 2 ? function(n) {
				e(t, n);
			} : e), r[t] = a && function(e) {
				a("[xmldom " + t + "]	" + e + m(n));
			} || function() {};
		}
		return a("warning"), a("error"), a("fatalError"), r;
	}
	function f() {
		this.cdata = !1;
	}
	function p(e, t) {
		t.lineNumber = e.lineNumber, t.columnNumber = e.columnNumber;
	}
	f.prototype = {
		startDocument: function() {
			this.doc = new a().createDocument(null, null, null), this.locator && (this.doc.documentURI = this.locator.systemId);
		},
		startElement: function(e, t, n, r) {
			var i = this.doc, a = i.createElementNS(e, n || t), o = r.length;
			g(this, a), this.currentElement = a, this.locator && p(this.locator, a);
			for (var s = 0; s < o; s++) {
				var e = r.getURI(s), c = r.getValue(s), n = r.getQName(s), l = i.createAttributeNS(e, n);
				this.locator && p(r.getLocator(s), l), l.value = l.nodeValue = c, a.setAttributeNode(l);
			}
		},
		endElement: function(e, t, n) {
			var r = this.currentElement;
			r.tagName, this.currentElement = r.parentNode;
		},
		startPrefixMapping: function(e, t) {},
		endPrefixMapping: function(e) {},
		processingInstruction: function(e, t) {
			var n = this.doc.createProcessingInstruction(e, t);
			this.locator && p(this.locator, n), g(this, n);
		},
		ignorableWhitespace: function(e, t, n) {},
		characters: function(e, t, n) {
			if (e = h.apply(this, arguments), e) {
				if (this.cdata) var r = this.doc.createCDATASection(e);
				else var r = this.doc.createTextNode(e);
				this.currentElement ? this.currentElement.appendChild(r) : /^\s*$/.test(e) && this.doc.appendChild(r), this.locator && p(this.locator, r);
			}
		},
		skippedEntity: function(e) {},
		endDocument: function() {
			this.doc.normalize();
		},
		setDocumentLocator: function(e) {
			(this.locator = e) && (e.lineNumber = 0);
		},
		comment: function(e, t, n) {
			e = h.apply(this, arguments);
			var r = this.doc.createComment(e);
			this.locator && p(this.locator, r), g(this, r);
		},
		startCDATA: function() {
			this.cdata = !0;
		},
		endCDATA: function() {
			this.cdata = !1;
		},
		startDTD: function(e, t, n) {
			var r = this.doc.implementation;
			if (r && r.createDocumentType) {
				var i = r.createDocumentType(e, t, n);
				this.locator && p(this.locator, i), g(this, i), this.doc.doctype = i;
			}
		},
		warning: function(e) {
			console.warn("[xmldom warning]	" + e, m(this.locator));
		},
		error: function(e) {
			console.error("[xmldom error]	" + e, m(this.locator));
		},
		fatalError: function(e) {
			throw new s(e, this.locator);
		}
	};
	function m(e) {
		if (e) return "\n@" + (e.systemId || "") + "#[line:" + e.lineNumber + ",col:" + e.columnNumber + "]";
	}
	function h(e, t, n) {
		return typeof e == "string" ? e.substr(t, n) : e.length >= t + n || t ? new java.lang.String(e, t, n) + "" : e;
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(e) {
		f.prototype[e] = function() {
			return null;
		};
	});
	function g(e, t) {
		e.currentElement ? e.currentElement.appendChild(t) : e.doc.appendChild(t);
	}
	e.__DOMHandler = f, e.normalizeLineEndings = l, e.DOMParser = u;
})), E = (/* @__PURE__ */ f(((e) => {
	var t = S();
	e.DOMImplementation = t.DOMImplementation, e.XMLSerializer = t.XMLSerializer, e.DOMParser = T().DOMParser;
})))(), D = "http://schemas.openxmlformats.org/wordprocessingml/2006/main", O = "http://www.w3.org/XML/1998/namespace";
function k(e, t) {
	return e?.nodeType === 1 && e.localName === t;
}
function A(e, t) {
	return Array.from(e.childNodes || []).filter((e) => t ? k(e, t) : e.nodeType === 1);
}
function j(e, t = []) {
	for (let n of Array.from(e.childNodes || [])) k(n, "t") ? t.push(n) : j(n, t);
	return t;
}
function M(e) {
	return j(e).map((e) => e.textContent ?? "").join("");
}
function N(e, t) {
	let n = e?.parentNode ?? null;
	for (; n;) {
		if (k(n, t)) return n;
		n = n.parentNode;
	}
	return null;
}
function P(e) {
	return e ? e.cloneNode(!0) : null;
}
function F(e, t, n) {
	let r = A(t, "pPr")[0] ?? null, i = A(t, "r")[0] ?? null, a = i ? A(i, "rPr")[0] ?? null : null, o = Array.from(t.childNodes || []).filter((e) => !(r && e === r));
	for (let e of o) t.removeChild(e);
	let s = e.createElementNS(D, "w:r");
	a && s.appendChild(P(a));
	let c = String(n).split("\n");
	c.forEach((t, n) => {
		let r = e.createElementNS(D, "w:t");
		(t.startsWith(" ") || t.endsWith(" ") || t.includes("  ")) && r.setAttributeNS(O, "xml:space", "preserve"), r.appendChild(e.createTextNode(t)), s.appendChild(r), n < c.length - 1 && s.appendChild(e.createElementNS(D, "w:br"));
	}), t.appendChild(s);
}
async function I({ templatePath: n, outputPath: r, replacements: i }) {
	let a = await g(n, "profe-docx"), o = t.join(a, "word", "document.xml"), s = await e.readFile(o, "utf8"), c = new E.DOMParser().parseFromString(s, "application/xml"), l = Array.from(c.getElementsByTagNameNS(D, "p"));
	for (let e of l) {
		let t = j(e);
		if (t.length === 0) continue;
		let n = t.map((e) => e.textContent ?? "").join(""), r = n;
		for (let [e, t] of Object.entries(i)) r = r.replaceAll(e, t);
		let a = N(e, "tc");
		(a ? M(a) : "").includes("Quantidade de Aulas:") && n.includes("{{AVALIACAO}}") && (r = r.replaceAll(i["{{AVALIACAO}}"], i["{{QTD_AULAS}}"])), n.trim() === "´" && (r = ""), r !== n && F(c, e, r);
	}
	let u = new E.XMLSerializer().serializeToString(c);
	await e.writeFile(o, u, "utf8"), await _(a, r);
}
//#endregion
//#region electron/services/openai-plan.js
var L = {
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
function R({ sources: e, instructionContent: t, instructionFileName: n, outputConfig: r }) {
	let i = e.map((e) => e.fileName).join(", "), a = e.map((e, t) => `### INICIO_FONTE_${t + 1}\nArquivo: ${e.fileName}\n${e.fullText}\n### FIM_FONTE_${t + 1}`).join("\n\n---\n\n"), o = [
		r?.professor ? `- professor: usar exatamente "${r.professor}"` : null,
		r?.turmas ? `- turmas: usar exatamente "${r.turmas}"` : null,
		r?.quantidadeAulas ? `- quantidade de aulas: usar exatamente "${r.quantidadeAulas}"` : null,
		r?.dataDe ? `- data inicial do período: usar exatamente "${r.dataDe}"` : null,
		r?.dataAte ? `- data final do período: usar exatamente "${r.dataAte}"` : null
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
		t ? `Use a instrução abaixo como regra principal de transformação. Arquivo da instrução: ${n || "instrucao-default.md"}` : "Use os critérios abaixo como regra principal de transformação.",
		t ? "" : null,
		t || null,
		t ? "" : null,
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
		o.length > 0 ? "" : null,
		o.length > 0 ? "Configurações de saída definidas pela interface:" : null,
		o.length > 0 ? o.join("\n") : null,
		"",
		`Quantidade de arquivos-fonte: ${e.length}`,
		`Arquivos-fonte: ${i}`,
		"",
		"Conteúdo extraído dos PPTX:",
		a
	].filter(Boolean).join("\n");
}
function z(e) {
	if (typeof e?.output_text == "string" && e.output_text.trim()) return e.output_text.trim();
	let t = Array.isArray(e?.output) ? e.output : [], n = [], r = [];
	for (let e of t) if (Array.isArray(e?.content)) for (let t of e.content) t?.type === "output_text" && typeof t.text == "string" && n.push(t.text), t?.type === "refusal" && typeof t.refusal == "string" && r.push(t.refusal);
	if (n.length > 0) return n.join("\n").trim();
	if (r.length > 0) throw Error(`A OpenAI recusou a geração: ${r.join(" ")}`);
	if (e?.status === "incomplete") {
		let t = e?.incomplete_details?.reason || e?.incomplete_details?.type || "resposta incompleta";
		throw Error(`A OpenAI retornou uma resposta incompleta: ${t}.`);
	}
	throw Error("A OpenAI não retornou texto estruturado para o plano de aula.");
}
async function ee({ apiKey: e, model: t, sources: n, instructionContent: r, instructionFileName: i, outputConfig: a }) {
	let o = await fetch("https://api.openai.com/v1/responses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${e}`
		},
		body: JSON.stringify({
			model: t,
			input: R({
				sources: n,
				instructionContent: r,
				instructionFileName: i,
				outputConfig: a
			}),
			text: {
				format: {
					type: "json_schema",
					...L
				},
				verbosity: "medium"
			}
		})
	});
	if (!o.ok) {
		let e = await o.text();
		throw Error(`Falha na OpenAI API: ${o.status} ${e}`);
	}
	let s = z(await o.json());
	return JSON.parse(s);
}
//#endregion
//#region electron/services/templates.js
var B = "plano-de-aula-template-com-ancoras.docx";
function te(e) {
	return `${String(e || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-_.]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/\.docx$/i, "") || "template"}.docx`;
}
async function V(n) {
	return await e.mkdir(n, { recursive: !0 }), (await e.readdir(n, { withFileTypes: !0 })).filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".docx")).sort((e, t) => e.name.localeCompare(t.name, "pt-BR")).map((e) => ({
		fileName: e.name,
		path: t.join(n, e.name),
		isDefaultBuiltIn: e.name === B
	}));
}
async function H(n, r) {
	await e.mkdir(n, { recursive: !0 });
	let i = te(t.basename(r)), a = t.join(n, i);
	return await e.copyFile(r, a), {
		fileName: i,
		path: a
	};
}
//#endregion
//#region electron/services/paths.js
var ne = n(import.meta.url), re = t.dirname(ne);
function ie(e) {
	let n = [
		e,
		t.resolve(e, ".."),
		t.resolve(e, "..", ".."),
		process.cwd()
	];
	for (let e of n) if (d.existsSync(t.join(e, "package.json"))) return e;
	return t.resolve(e, "..");
}
var ae = ie(re);
function U(e) {
	return d.mkdirSync(e, { recursive: !0 }), e;
}
function oe() {
	return i.isPackaged ? process.resourcesPath : ae;
}
function se() {
	return i.isPackaged ? t.join(i.getPath("userData"), "workspace") : ae;
}
function W(e, n) {
	if (d.existsSync(e)) {
		U(n);
		for (let r of d.readdirSync(e, { withFileTypes: !0 })) {
			let i = t.join(e, r.name), a = t.join(n, r.name);
			if (r.isDirectory()) {
				W(i, a);
				continue;
			}
			d.existsSync(a) || d.copyFileSync(i, a);
		}
	}
}
function G() {
	return t.join(se(), "entradas");
}
function K() {
	return t.join(se(), "saidas");
}
function q(e = {}) {
	let n = oe(), r = se(), i = t.resolve(e.inputDir || G()), a = t.resolve(e.outputDir || K());
	return {
		root: r,
		bundledRoot: n,
		entradasDir: U(i),
		saidasDir: U(a),
		templatesDir: U(t.join(r, "templates")),
		instrucoesDir: U(t.join(r, "instrucoes")),
		bundledTemplatesDir: t.join(n, "templates"),
		bundledInstrucoesDir: t.join(n, "instrucoes"),
		defaultTemplatePath: t.join(r, "templates", e.defaultTemplateFileName || "plano-de-aula-template-com-ancoras.docx")
	};
}
function ce(e) {
	W(e.bundledTemplatesDir, e.templatesDir), W(e.bundledInstrucoesDir, e.instrucoesDir);
}
//#endregion
//#region electron/services/instructions.js
var J = "preencher-plano-de-aula-a-partir-do-pptx.md", le = "---\nname: preencher-plano-de-aula-a-partir-do-pptx\ndescription: Use esta instrução quando eu pedir para preencher o template de plano de aula com âncoras `.docx` a partir de 1 a 3 arquivos `.pptx`, consolidando os conteúdos em um único plano e respeitando as configurações de saída definidas na interface.\n---\n\n# Instrução\n\nQuando eu mencionar `preencher-plano-de-aula-a-partir-do-pptx`, execute este fluxo.\n\n## Objetivo\n\nLer de 1 a 3 arquivos `.pptx` de aula, consolidar esses materiais em um único plano de aula, preencher o template `.docx` com âncoras `{{...}}` e gerar um novo documento final. Usar os critérios pedagógicos e editoriais descritos nesta instrução para melhorar a qualidade do preenchimento de cada campo.\n\n## Entradas esperadas\n\n- De 1 a 3 arquivos `.pptx` com o conteúdo de uma aula ou sequência de aulas relacionadas.\n- Como template padrão de saída, usar:\n  `templates/plano-de-aula-template-com-ancoras.docx`\n- Opcionalmente, aceitar outro template `.docx` com âncoras se o usuário indicar explicitamente.\n- A interface pode fornecer explicitamente estes campos de saída, que têm prioridade sobre qualquer inferência do material:\n  - nome do professor\n  - turmas\n  - quantidade de aulas\n  - período de realização (`DATA_DE` e `DATA-ATÉ`)\n- Quando possível, a interface pode pré-preencher `turmas` a partir da leitura dos `.pptx`, mas o valor final continua editável pelo usuário e deve ser respeitado se ele fizer ajustes.\n\nConvenção de caminhos do projeto:\n\n- arquivos-fonte da aula em `entradas/`\n- templates em `templates/`\n- instruções em `instrucoes/`\n- arquivos gerados em `saidas/`\n\n## Resultado esperado\n\n- Gerar uma cópia preenchida do `.docx`.\n- Preservar o template original.\n- Validar que não restaram placeholders `{{...}}` no arquivo final.\n- Garantir que o texto preenchido não seja apenas copiado dos `.pptx`, mas organizado conforme os critérios pedagógicos desta instrução.\n- Ser idempotente: repetir a execução com os mesmos arquivos de entrada deve produzir o mesmo arquivo de saída, sem criar variantes desnecessárias nem acumular duplicatas.\n\n## Procedimento\n\n1. Confirmar que todos os arquivos-fonte existem e são legíveis.\n2. Se o usuário não indicar outro template, usar como base o arquivo:\n   `templates/plano-de-aula-template-com-ancoras.docx`\n3. Extrair o texto de todos os `.pptx`, incluindo conteúdo dos slides e, se necessário, slides de orientação para professores.\n4. Identificar todas as âncoras do template `{{...}}`, inclusive quando estiverem quebradas em múltiplos trechos internos do Word.\n5. Montar um único plano a partir do conjunto dos materiais, tratando os `.pptx` como partes de uma mesma proposta de aula ou sequência curta de aulas.\n6. Analisar cada `.pptx` individualmente antes da síntese final, garantindo que todos contribuam para o plano e que nenhuma fonte seja ignorada.\n7. Montar o mapeamento entre as âncoras do template e o conteúdo consolidado dos `.pptx`, refinando a redação com base nos critérios descritos nesta instrução.\n8. Se a interface tiver fornecido professor, turmas, quantidade de aulas ou período de realização, usar esses valores explicitamente no resultado final.\n9. Preencher o `.docx` em uma cópia nova, nunca sobrescrevendo o template original sem pedido explícito.\n10. Validar o arquivo final:\n   - conferir se o conteúdo principal foi inserido;\n   - verificar se não sobrou nenhum `{{...}}`;\n   - corrigir placeholders quebrados em múltiplos trechos do XML, se houver;\n   - corrigir problemas estruturais do template apenas no arquivo gerado, se necessário.\n\n## Idempotência\n\nEsta instrução deve ser executada de forma idempotente.\n\n- Com os mesmos arquivos de entrada, usar sempre o mesmo caminho de saída derivado do conteúdo.\n- Se o arquivo de saída já existir e já estiver consistente com a entrada atual, reutilizá-lo em vez de criar outro.\n- Se o arquivo de saída já existir mas estiver desatualizado em relação à entrada atual, atualizá-lo no mesmo caminho.\n- Nunca criar nomes incrementais como `copia`, `final`, `novo`, `v2` ou semelhantes, exceto se o usuário pedir explicitamente.\n- Nunca duplicar ou renomear template, instrução ou arquivo-fonte apenas por executar o fluxo novamente.\n- Se houver necessidade de corrigir um problema estrutural do template, aplicar a correção apenas no arquivo gerado final, de forma determinística.\n\n## Regras de preenchimento\n\n- Priorizar conteúdo explícito dos `.pptx`.\n- Tratar o arquivo `templates/plano-de-aula-template-com-ancoras.docx` como template padrão de saída.\n- Se o template tiver placeholders quebrados em vários trechos internos do Word, tratá-los como um único placeholder lógico.\n- Se os `.pptx` não trouxerem um dado objetivo para um campo, preencher com uma marcação pragmática e explícita em vez de inventar informação.\n- Quando houver mais de um `.pptx`, consolidar os materiais em um único plano coerente, sem tratar cada apresentação como um plano separado.\n- Quando houver 2 ou 3 `.pptx`, é obrigatório considerar o conjunto inteiro; ignorar a segunda ou terceira fonte é erro de execução.\n- O plano final deve refletir progressão, complementaridade ou distribuição de atividades entre as fontes sempre que isso estiver presente no material.\n- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores devem prevalecer sobre qualquer inferência do material.\n- Manter consistência com o nível de ensino, disciplina, tema, objetivos, metodologia, recursos e avaliação encontrados no material.\n- Se o template tiver erro estrutural, como um campo apontando para a âncora errada, corrigir isso apenas no arquivo gerado.\n- Não transformar a resposta em transcrição dos slides; consolidar e escrever o plano de aula em formato final de uso.\n- Manter o processo determinístico sempre que possível: mesmos insumos devem levar ao mesmo mapeamento, mesmo nome de arquivo e mesma estrutura de saída.\n\n## Defaults permitidos quando faltarem dados\n\n- `PROFESSOR`: usar o valor configurado na interface; se não houver, `A definir`\n- `PERÍODO DE REALIZAÇÃO`: usar informação objetiva do material; se não houver, usar algo como `conforme calendário escolar`\n- `Quantidade de Aulas`: usar o valor configurado na interface; se não houver, inferir pelo material apenas se for seguro; caso contrário, usar `A definir`\n\n## Mapeamento sugerido\n\n- `{{DISCIPLINA-TITULO}}`: combinação curta para o cabeçalho, como `Arte - 9º ano`\n- `{{DISCIPLINA}}`: disciplina principal do material\n- `{{TURMAS}}`: ano/série e segmento, preferindo o valor explicitamente configurado na interface quando houver\n- `{{TEMA_DA_AULA}}`: título central da aula\n- `{{CONTEÚDO}}`: tópicos e conceitos trabalhados\n- `{{HABILIDADES}}`: habilidades, competências e códigos curriculares presentes\n- `{{METODOLOGIA}}`: dinâmica, estratégias, etapas e condução da aula\n- `{{OBJETIVOS}}`: objetivos de aprendizagem explícitos ou claramente inferíveis\n- `{{RECURSOS}}`: materiais e recursos necessários\n- `{{AVALIACAO}}`: critérios, dimensão avaliada e forma de observação/sistematização\n- `{{DATA_DE}}` e `{{DATA-ATÉ}}`: período de realização, preferindo os valores explicitamente configurados na interface quando houver\n\n## Critérios de redação por campo\n\nUsar estes critérios para melhorar a qualidade do preenchimento das âncoras:\n\n- `{{TEMA_DA_AULA}}`: escrever um tema específico, claro e diretamente ligado ao recorte da aula.\n- `{{CONTEÚDO}}`: desdobrar o tema em tópicos e conceitos que realmente serão trabalhados na aula.\n- `{{HABILIDADES}}`: priorizar habilidades como ações observáveis de aprendizagem; incluir códigos curriculares quando estiverem no material.\n- `{{METODOLOGIA}}`: descrever como a aula acontecerá de fato, com estratégias, dinâmica, mediação, escuta, análise, exposição, prática e socialização.\n- `{{OBJETIVOS}}`: redigir objetivos claros, preferencialmente com verbos no infinitivo e, quando fizer sentido, explicitar a finalidade do desenvolvimento proposto.\n- `{{RECURSOS}}`: listar materiais e suportes concretos necessários para executar a aula, detalhando itens e quantidades quando isso estiver claro no material.\n- `{{AVALIACAO}}`: indicar como a aprendizagem será observada ou verificada e quais critérios serão considerados.\n\n## Observações do template com âncoras\n\nO template `templates/plano-de-aula-template-com-ancoras.docx` tem um problema estrutural:\n\n- o campo `Quantidade de Aulas` reaproveita a âncora `{{AVALIACAO}}`;\n- ao preencher, corrigir isso apenas no arquivo final gerado, substituindo esse trecho pelo valor adequado de quantidade de aulas.\n\n## Nome do arquivo de saída\n\nSalvar o resultado sempre na pasta:\n\n`saidas/`\n\nUsar obrigatoriamente esta convenção de nome:\n\n`plano-de-aula-{disciplina-slug}-{ano-serie-slug}-aula-{nn}.docx`\n\nRegras para composição:\n\n- `disciplina-slug`: disciplina em minúsculas, sem acentos e com palavras separadas por hífen.\n- `ano-serie-slug`: ano ou série em minúsculas, sem acentos e com palavras separadas por hífen.\n- `nn`: número da aula com dois dígitos, como `01`, `02`, `03`.\n\nExemplo:\n\n`saidas/plano-de-aula-arte-9o-ano-aula-01.docx`\n\nEsse nome deve ser estável entre execuções com os mesmos insumos.\n\n## Resposta final\n\nNa resposta final:\n\n- informar o caminho do arquivo gerado;\n- dizer se o template original foi preservado;\n- dizer se todos os placeholders foram substituídos;\n- dizer se os critérios desta instrução foram aplicados no refinamento do texto;\n- apontar rapidamente qualquer campo preenchido com fallback.\n";
function ue(e) {
	return `${String(e || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-_.]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/\.md$/i, "") || "instrucao"}.md`;
}
async function Y(n) {
	let r = t.join(n, J);
	try {
		await e.access(r);
	} catch {
		await e.writeFile(r, le, "utf8");
	}
	return r;
}
async function de(n) {
	await Y(n);
	let r = await e.readdir(n, { withFileTypes: !0 });
	return await Promise.all(r.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md")).sort((e, t) => e.name.localeCompare(t.name, "pt-BR")).map(async (r) => {
		let i = t.join(n, r.name), a = await e.readFile(i, "utf8");
		return {
			fileName: r.name,
			path: i,
			content: a,
			isDefaultBuiltIn: r.name === J
		};
	}));
}
async function fe(n, { fileName: r, content: i }) {
	await e.mkdir(n, { recursive: !0 });
	let a = ue(r), o = t.join(n, a);
	return await e.writeFile(o, String(i ?? ""), "utf8"), {
		fileName: a,
		path: o
	};
}
async function X(n, r) {
	await Y(n);
	let i = ue(r), a = t.join(n, i);
	return {
		fileName: i,
		path: a,
		content: await e.readFile(a, "utf8"),
		isDefaultBuiltIn: i === J
	};
}
async function pe(n) {
	await e.mkdir(n, { recursive: !0 });
	let r = t.join(n, J);
	return await e.writeFile(r, le, "utf8"), {
		fileName: J,
		path: r,
		content: le,
		isDefaultBuiltIn: !0
	};
}
//#endregion
//#region electron/main.js
var me = n(import.meta.url), he = t.dirname(me), ge = "settings.json";
function _e(e) {
	return String(e).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
function ve(e) {
	return String(e).replace(/\D/g, "").padStart(2, "0").slice(-2);
}
function ye() {
	return t.join(i.getPath("userData"), ge);
}
async function Z() {
	try {
		let t = await e.readFile(ye(), "utf8"), n = JSON.parse(t);
		return {
			apiKey: n.apiKey || "",
			model: n.model || "gpt-5.4-mini",
			professorName: n.professorName || "",
			planTurmas: n.planTurmas || "",
			planQuantidadeAulas: n.planQuantidadeAulas || "1",
			planDataDe: n.planDataDe || "",
			planDataAte: n.planDataAte || "",
			inputDir: n.inputDir || G(),
			outputDir: n.outputDir || K(),
			defaultTemplateFileName: n.defaultTemplateFileName || "plano-de-aula-template-com-ancoras.docx",
			defaultInstructionFileName: n.defaultInstructionFileName || "preencher-plano-de-aula-a-partir-do-pptx.md"
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
			inputDir: G(),
			outputDir: K(),
			defaultTemplateFileName: B,
			defaultInstructionFileName: J
		};
	}
}
async function Q(t) {
	return await e.mkdir(i.getPath("userData"), { recursive: !0 }), await e.writeFile(ye(), JSON.stringify(t, null, 2), "utf8"), t;
}
function be(e, n) {
	let { saidasDir: r } = n, i = `plano-de-aula-${_e(e.disciplina || "disciplina")}-${_e(e.anoSerieSlug || "ano")}-aula-${ve(e.aulaNumero || "1")}.docx`;
	return t.join(r, i);
}
async function xe(n) {
	let r = await e.stat(n);
	return {
		name: t.basename(n),
		path: n,
		modifiedAt: r.mtime.toISOString(),
		modifiedAtMs: r.mtimeMs
	};
}
function Se(e) {
	let t = String(e || "").replace(/\s+/g, " ").trim(), n = t.match(/turmas?\s*[:\-]\s*([^.|\n\r]+?)(?:slide\s+\d+[: ]|$)/i);
	if (n?.[1]) return n[1].trim();
	let r = [...t.matchAll(/\b(\d{1,2}\s*(?:º|°|o|ª|a)?\s*(?:ano|anos|serie|série))\b/gi)].map((e) => e[1].replace(/\s+/g, " ").trim()).filter(Boolean), i = [...new Set(r)];
	return i.length === 0 ? "" : i.slice(0, 3).join(", ");
}
function Ce(e) {
	return {
		"{{DISCIPLINA-TITULO}}": e.disciplinaTitulo,
		"{{PROFESSOR}}": e.professor,
		"{{TURMAS}}": e.turmas,
		"{{DISCIPLINA}}": e.disciplina,
		"{{TEMA_DA_AULA}}": e.temaDaAula,
		"{{CONTEÚDO}}": e.conteudo,
		"{{HABILIDADES}}": e.habilidades,
		"{{METODOLOGIA}}": e.metodologia,
		"{{OBJETIVOS}}": e.objetivos,
		"{{RECURSOS}}": e.recursos,
		"{{AVALIACAO}}": e.avaliacao,
		"{{QTD_AULAS}}": e.quantidadeAulas,
		"{{DATA_DE}}": e.dataDe,
		"{{DATA-ATÉ}}": e.dataAte
	};
}
async function we(n, r) {
	if (r) {
		let i = t.join(n.templatesDir, r);
		try {
			return await e.access(i), i;
		} catch {}
	}
	let i = await V(n.templatesDir);
	if (i.length > 0) return i[0].path;
	throw Error("Nenhum template .docx encontrado em templates/. Importe ou adicione um template antes de gerar o plano.");
}
function $(e) {
	let t = String(e || "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
	let [n, r, i] = t.split("-");
	return `${i}/${r}/${n}`;
}
function Te(e, t, n) {
	let r = String(t?.professor || "").trim() || String(n.professorName || "").trim() || e.professor || "A definir", i = String(t?.turmas || "").trim() || String(n.planTurmas || "").trim() || e.turmas || "A definir", a = String(t?.quantidadeAulas || "").trim() || String(n.planQuantidadeAulas || "").trim() || e.quantidadeAulas || "A definir", o = $(t?.dataDe) || $(n.planDataDe) || e.dataDe || "conforme calendário escolar", s = $(t?.dataAte) || $(n.planDataAte) || e.dataAte || o;
	return {
		...e,
		professor: r,
		turmas: i,
		quantidadeAulas: a,
		dataDe: o,
		dataAte: s
	};
}
async function Ee() {
	let e = new r({
		width: 1260,
		height: 840,
		minWidth: 1024,
		minHeight: 720,
		backgroundColor: "#efe2c6",
		webPreferences: {
			preload: i.isPackaged ? t.join(process.resourcesPath, "app.asar", "electron", "preload.cjs") : t.join(he, "..", "electron", "preload.cjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	});
	process.env.VITE_DEV_SERVER_URL ? await e.loadURL(process.env.VITE_DEV_SERVER_URL) : await e.loadFile(t.join(he, "..", "dist", "index.html"));
}
o.handle("app:get-state", async () => {
	let n = await Z(), r = q(n);
	ce(r), await Y(r.instrucoesDir);
	let i = await e.readdir(r.entradasDir, { withFileTypes: !0 }), a = await de(r.instrucoesDir), o = await V(r.templatesDir);
	!o.some((e) => e.fileName === n.defaultTemplateFileName) && o.length > 0 && (n = {
		...n,
		defaultTemplateFileName: o[0].fileName
	}, await Q(n));
	let s = await Promise.all(i.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pptx")).map((e) => xe(t.join(r.entradasDir, e.name))));
	return {
		projectPaths: r,
		settings: {
			...n,
			apiKeyConfigured: !!n.apiKey
		},
		instructions: a,
		templates: o,
		availableInputs: s
	};
}), o.handle("settings:get", async () => {
	let e = await Z();
	return {
		...e,
		apiKeyConfigured: !!e.apiKey
	};
}), o.handle("settings:save", async (t, n) => {
	let r = {
		apiKey: String(n.apiKey ?? "").trim(),
		model: String(n.model ?? "gpt-5.4-mini").trim() || "gpt-5.4-mini",
		professorName: String(n.professorName ?? "").trim(),
		planTurmas: String(n.planTurmas ?? "").trim(),
		planQuantidadeAulas: String(n.planQuantidadeAulas ?? "1").trim() || "1",
		planDataDe: String(n.planDataDe ?? "").trim(),
		planDataAte: String(n.planDataAte ?? "").trim(),
		inputDir: String(n.inputDir ?? G()).trim() || G(),
		outputDir: String(n.outputDir ?? K()).trim() || K(),
		defaultTemplateFileName: String(n.defaultTemplateFileName ?? "plano-de-aula-template-com-ancoras.docx").trim() || "plano-de-aula-template-com-ancoras.docx",
		defaultInstructionFileName: String(n.defaultInstructionFileName ?? "preencher-plano-de-aula-a-partir-do-pptx.md").trim() || "preencher-plano-de-aula-a-partir-do-pptx.md"
	}, i = q(r);
	await e.mkdir(i.entradasDir, { recursive: !0 }), await e.mkdir(i.saidasDir, { recursive: !0 });
	let a = await Q(r);
	return {
		...a,
		apiKeyConfigured: !!a.apiKey
	};
}), o.handle("files:pick-inputs", async () => {
	let { entradasDir: e } = q(await Z()), t = r.getFocusedWindow() ?? r.getAllWindows()[0], n = await a.showOpenDialog(t, {
		title: "Selecionar aulas em PowerPoint",
		defaultPath: e,
		properties: ["openFile", "multiSelections"],
		buttonLabel: "Selecionar arquivos",
		filters: [{
			name: "PowerPoint",
			extensions: ["pptx"]
		}]
	});
	return n.canceled || n.filePaths.length === 0 ? [] : Promise.all(n.filePaths.map((e) => xe(e)));
}), o.handle("plans:detect-fields", async (e, t) => {
	let n = Array.isArray(t?.inputPaths) ? t.inputPaths.filter(Boolean).slice(0, 3) : [];
	return n.length === 0 ? { turmas: "" } : { turmas: Se((await Promise.all(n.map(async (e) => {
		let { fullText: t } = await b(e);
		return t;
	}))).join("\n")) };
}), o.handle("files:pick-directory", async (e, t) => {
	let n = q(await Z()), i = r.getFocusedWindow() ?? r.getAllWindows()[0], o = t === "output" ? n.saidasDir : n.entradasDir, s = await a.showOpenDialog(i, {
		title: t === "output" ? "Selecionar pasta de saída" : "Selecionar pasta de entrada",
		defaultPath: o,
		properties: [
			"openDirectory",
			"createDirectory",
			"promptToCreate"
		],
		buttonLabel: "Selecionar pasta"
	});
	return s.canceled || s.filePaths.length === 0 ? null : s.filePaths[0];
}), o.handle("templates:pick-template", async () => {
	let e = q(await Z()), t = r.getFocusedWindow() ?? r.getAllWindows()[0], n = await a.showOpenDialog(t, {
		title: "Selecionar template DOCX",
		defaultPath: e.templatesDir,
		properties: ["openFile"],
		buttonLabel: "Selecionar template",
		filters: [{
			name: "Word",
			extensions: ["docx"]
		}]
	});
	return n.canceled || n.filePaths.length === 0 ? null : n.filePaths[0];
}), o.handle("instructions:save", async (e, t) => {
	let n = q(), r = await fe(n.instrucoesDir, {
		fileName: t?.fileName,
		content: t?.content
	});
	return X(n.instrucoesDir, r.fileName);
}), o.handle("instructions:reset-default", async () => {
	let e = await pe(q().instrucoesDir);
	return await Q({
		...await Z(),
		defaultInstructionFileName: J
	}), e;
}), o.handle("instructions:set-default", async (e, t) => {
	let n = {
		...await Z(),
		defaultInstructionFileName: String(t || "preencher-plano-de-aula-a-partir-do-pptx.md")
	};
	return await Q(n), n;
}), o.handle("templates:import", async (e, t) => {
	if (!t) throw Error("Nenhum template foi selecionado.");
	return await H(q(await Z()).templatesDir, t);
}), o.handle("templates:set-default", async (e, t) => {
	let n = {
		...await Z(),
		defaultTemplateFileName: String(t || "plano-de-aula-template-com-ancoras.docx")
	};
	return await Q(n), n;
}), o.handle("files:open-path", async (e, t) => t ? (await s.openPath(t), !0) : !1), o.handle("plans:generate", async (e, n) => {
	let r = Array.isArray(n?.inputPaths) ? n.inputPaths.filter(Boolean) : [], i = n?.outputConfig || {};
	if (r.length === 0) throw Error("Selecione pelo menos um arquivo .pptx.");
	if (r.length > 3) throw Error("Use no máximo 3 arquivos .pptx por plano de aula.");
	let a = await Z(), o = q(a);
	if (ce(o), !a.apiKey) throw Error("Configure a OpenAI API key antes de gerar o plano.");
	let s = await X(o.instrucoesDir, a.defaultInstructionFileName || "preencher-plano-de-aula-a-partir-do-pptx.md");
	try {
		let e = [];
		for (let n of r) {
			let { fullText: r } = await b(n);
			e.push({
				fileName: t.basename(n),
				fullText: r
			});
		}
		let n = Te(await ee({
			apiKey: a.apiKey,
			model: a.model || "gpt-5.4-mini",
			sources: e,
			instructionContent: s.content,
			instructionFileName: s.fileName,
			outputConfig: i
		}), i, a), c = be(n, o), l = Ce(n);
		return await I({
			templatePath: await we(o, a.defaultTemplateFileName),
			outputPath: c,
			replacements: l
		}), {
			count: 1,
			failedCount: 0,
			model: a.model || "gpt-5.4-mini",
			instructionFileName: s.fileName,
			items: [{
				inputPaths: r,
				outputPath: c,
				summary: {
					disciplina: n.disciplina,
					turma: n.turmas,
					tema: n.temaDaAula
				}
			}],
			failures: []
		};
	} catch (e) {
		return {
			count: 0,
			failedCount: 1,
			model: a.model || "gpt-5.4-mini",
			instructionFileName: s.fileName,
			items: [],
			failures: [{
				inputPath: r.join(", "),
				fileName: r.map((e) => t.basename(e)).join(", "),
				message: e instanceof Error ? e.message : "Falha desconhecida na geração."
			}]
		};
	}
}), o.handle("files:clear-inputs", async () => {
	let n = q(await Z()), r = (await e.readdir(n.entradasDir, { withFileTypes: !0 })).filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pptx")).map((e) => t.join(n.entradasDir, e.name));
	for (let t of r) await e.unlink(t);
	return { removedCount: r.length };
}), i.whenReady().then(async () => {
	await Ee(), i.on("activate", async () => {
		r.getAllWindows().length === 0 && await Ee();
	});
}), i.on("window-all-closed", () => {
	process.platform !== "darwin" && i.quit();
});
//#endregion
