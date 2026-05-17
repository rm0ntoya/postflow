(function(_ds){var window=this;var ysa=async function(a,b){const c=a.o;let d;const e=b.id!==((d=a.oa)==null?void 0:d.id);e&&(a.className=b.id,a.eventLabel=`devsite-callout-${b.id}`,a.o=new _ds.BP(b.origin,a.eventLabel));a.oa=b;c&&e&&await _ds.AP(c)},zsa=async function(a){a.eventHandler.listen(document.body,"devsite-before-page-change",()=>{a.hide()})},Asa=async function(a,b){let c;((c=a.callout)==null?0:c.Qf)&&a.callout.Qf(b);await a.hide();a.Da({category:"Site-Wide Custom Events",action:"callout-dismiss",label:a.eventLabel})},
g0=async function(a,b){let c;((c=a.callout)==null?0:c.Se)&&a.callout.Se(b);let d;((d=a.callout)==null?0:d.Ij)||await a.hide();a.Da({category:"Site-Wide Custom Events",action:"callout-action",label:a.eventLabel})},Bsa=function(a){let b,c;if(((b=a.callout)==null?0:b.Ue)&&`${(c=a.callout)==null?void 0:c.Ue}`){let d,e;return(0,_ds.N)`<div class="devsite-callout-branding">
          <img
            class="devsite-callout-branding-image"
            src="${(d=a.callout)==null?void 0:d.Ue}"
            alt="${((e=a.callout)==null?void 0:e.Wg)||""}" />
        </div>
        <hr />`}return(0,_ds.N)``},Csa=function(a){let b,c;if(((b=a.callout)==null?0:b.Wq)&&`${(c=a.callout)==null?void 0:c.Wq}`){let d,e;return(0,_ds.N)`<div class="devsite-callout-hero">
        <img
          class="devsite-callout-hero-image"
          src="${(d=a.callout)==null?void 0:d.Wq}"
          alt="${((e=a.callout)==null?void 0:e.PB)||""}" />
      </div>`}return(0,_ds.N)``},Dsa=function(a){let b;if((b=a.callout)==null?0:b.Bv)return(0,_ds.N)``;let c;return(0,_ds.N)` <div class="devsite-callout-header">
        <h2>${((c=a.callout)==null?void 0:c.title)||""}</h2>
      </div>`},Esa=function(a){let b;if((b=a.callout)==null?0:b.loading)return(0,_ds.N)`<div class="devsite-callout-body"
        ><devsite-spinner size="24"></devsite-spinner
      ></div>`;let c,d;var e;if(((c=a.callout)==null?0:c.body)&&`${(d=a.callout)==null?void 0:d.body}`){{let f;if(((f=a.callout)==null?void 0:f.body)instanceof _ds.og){let g;a=(0,_ds.N)`${(0,_ds.SO)((g=a.callout)==null?void 0:g.body)}`}else a=(0,_ds.N)`${(e=a.callout)==null?void 0:e.body}`}e=(0,_ds.N)`<div class="devsite-callout-body">
        ${a}
      </div>`}else e=(0,_ds.N)``;return e},Fsa=function(a){var b;if((b=a.callout)==null||!b.Zc)return(0,_ds.N)``;var c;b=(0,_ds.xz)({button:!0,"button-primary":!0,"devsite-callout-action":!0,"button-disabled":((c=a.callout)==null?void 0:c.Eu)||!1});let d;c=(d=a.callout)==null?void 0:d.rz;let e;if((e=a.callout)==null?0:e.Rk){let g,h;return(0,_ds.N)`<a
        @click=${k=>{g0(a,k)}}
        href="${((g=a.callout)==null?void 0:g.Rk)||""}"
        class="${b}"
        aria-label=${c!=null?c:_ds.KA}
        data-title=${c!=null?c:_ds.KA}>
        ${((h=a.callout)==null?void 0:h.Zc)||""}
      </a>`}let f;return(0,_ds.N)`<button
        @click=${g=>{g0(a,g)}}
        class="${b}"
        aria-label=${c!=null?c:_ds.KA}
        data-title=${c!=null?c:_ds.KA}>
        ${((f=a.callout)==null?void 0:f.Zc)||""}
      </button>`},h0=class extends _ds.wC{set callout(a){ysa(this,a)}get callout(){return this.oa}get open(){let a;return((a=this.ma.value)==null?void 0:a.open)||!1}constructor(){super(["devsite-spinner"]);this.eventHandler=new _ds.v;this.eventLabel="";this.oa=this.ea=this.o=null;this.ma=new _ds.OO}connectedCallback(){super.connectedCallback();zsa(this)}disconnectedCallback(){super.disconnectedCallback();let a;(a=this.o)==null||a.cancel()}Na(){return this}async ready(){await this.j}async show(){await this.ready();
if(!this.open){var a;await ((a=this.o)==null?void 0:a.schedule(()=>{document.activeElement instanceof HTMLElement&&(this.ea=document.activeElement);var b;(b=this.ma.value)==null||b.show();let c;(c=this.querySelector(".devsite-callout-action"))==null||c.focus();let d;b={message:(((d=this.callout)==null?void 0:d.title)||"")+" caixa de di\u00e1logo aberta"};document.body.dispatchEvent(new CustomEvent("devsite-a11y-announce",{detail:b}));this.Da({category:"Site-Wide Custom Events",action:"callout-impression",
label:this.eventLabel,nonInteraction:!0})},()=>{let b;(b=this.ma.value)==null||b.close();let c;(c=this.querySelector(".devsite-callout-action"))==null||c.blur();this.ea&&this.ea.focus()}))}}async hide(){await this.ready();let a;await ((a=this.o)==null?void 0:_ds.AP(a))}render(){if(!this.callout)return(0,_ds.N)``;let a;return(0,_ds.N)`
      <dialog
        closedby="none"
        ${(0,_ds.QO)(this.ma)}
        aria-label="${((a=this.callout)==null?void 0:a.title)||""}"
        class="devsite-callout">
        ${Bsa(this)} ${Csa(this)}
        ${Dsa(this)} ${Esa(this)}
        <div class="devsite-callout-buttons">
          <button
            @click=${b=>{Asa(this,b)}}
            class="button button-dismiss devsite-callout-dismiss">
            ${"Dispensar"}
          </button>
          ${Fsa(this)}
        </div>
      </dialog>
    `}};_ds.x([_ds.H({ya:!1}),_ds.y("design:type",Object),_ds.y("design:paramtypes",[Object])],h0.prototype,"callout",null);try{customElements.define("devsite-callout",h0)}catch(a){console.warn("Unrecognized DevSite custom element - DevsiteCallout",a)};})(_ds_www);
