(function(_ds){var window=this;var una=async function(){const a=(await _ds.w()).getStaticPath();return(0,_ds.N)`<img src="${a}/images/cloud-shell-cta-art.png" />`};var vna=async function(){return await (await _ds.w()).getStorage().get("cloudshell","hide_fte_banner")},xX=class extends _ds.wC{constructor(){super(...arguments);this.isResizing=!1;this.offset=0;this.dw="";this.cloudtrack=new _ds.VF;this.Ug=a=>{this.Sr(a)};this.Vg=()=>{this.Tr()};this.XC=()=>{document.body.setAttribute("no-scroll","")};this.WC=()=>{document.body.hasAttribute("no-scroll")&&document.body.removeAttribute("no-scroll")}}Sr(a){this.isResizing&&this.Ve&&(a=Math.floor(this.Ve.bottom-a.clientY+
this.offset).toString(),this.resizer.setAttribute("aria-valuenow",a),this.style.height=a+"px")}Tr(){this.isResizing=!1;window.removeEventListener("pointermove",this.Ug);window.removeEventListener("pointerup",this.Vg);this.style.pointerEvents="auto";this.Xe("pane_resize",{uP:!0})}Na(){return this}render(){this.setAttribute("height-visual-offset","24");return(0,_ds.N)`
    <div
      class="resizer"
      role="separator"
      aria-valuemin="0"
      aria-valuemax="0"
      @pointerdown="${this.Vr}">
      <div class="grabber-focus">
        <div class="grabber"></div>
      </div>
    </div>
    <devsite-shell
      @pointerover="${this.XC}"
      @pointerout="${this.WC}"
      @devsite-shell-opened="${this.aD}"
      @devsite-shell-closed="${this.YC}"
      @devsite-shell-resized="${this.bD}"
      @devsite-shell-maximized="${this.ZC}">
    </devsite-shell>
    ${(0,_ds.N)` <div class="free-trial-banner">
    <a
      @click="${this.RC}"
      class="close-btn button-white material-icons"
      aria-label="${"Fechar o Cloud Shell"}"
      >close</a
    >
    <div class="banner-text">
      <h3>${"Este \u00e9 o Cloud Shell"}</h3>
      <p>${"O Cloud Shell \u00e9 um ambiente de desenvolvimento que pode ser usado no navegador:"}</p>
      <ul>
        <li>${"Ative o Cloud Shell e explore o Google Cloud com um terminal e um editor"}</li>
        <li>${"Comece seu teste sem custos financeiros e ganhe U$\u00a0300 em cr\u00e9ditos"}</li>
      </ul>
      <div class="row">
        <button
          @click="${this.KC}"
          class="button-blue"
          >${"Ativar o Cloud Shell"}
        </button>
        <button @click="${this.Wr}">
          ${"Fa\u00e7a um teste sem custos financeiros"}</button
        >
      </div>
    </div>
    ${(0,_ds.HM)(una(),"")}
  </div>`}
  `}bD(a){if(a==null?0:a.detail)a=(a.detail.vC+this.resizer.offsetHeight).toString(),this.resizer.setAttribute("aria-valuenow",a),this.style.height=a+"px",this.removeAttribute("devsite-size"),this.yn.isMaximized=!1,this.Xe("pane_resize",{isManual:!1})}async aD(){await vna()==="true"&&this.removeAttribute("enable-fte-user-flow");this.classList.add("opened");this.Xe("pane_open")}YC(){this.classList.remove("opened");this.Xe("pane_close");this.hasAttribute("devsite-size")&&(this.removeAttribute("devsite-size"),
this.yn.isMaximized=!1,this.style.height=this.dw);document.body.hasAttribute("no-scroll")&&document.body.removeAttribute("no-scroll")}ZC(){_ds.ab()&&this.setAttribute("cr-os","");this.dw=this.style.height;this.setAttribute("devsite-size","content-area");this.style.height="100%"}Vr(a){this.isResizing=!0;this.Ve=this.getBoundingClientRect();window.addEventListener("pointermove",this.Ug);window.addEventListener("pointerup",this.Vg);this.offset=a.offsetY;this.style.pointerEvents="none"}Xe(a,b){_ds.RF(this.cloudtrack,
"interaction",{component:"cloudShell",text:a.toString(),metadata:_ds.cu(b!=null?b:{})})}RC(){if(this.yn){var a=this.yn;a.j.isOpen&&a.j.close()}}KC(){this.Ku&&this.Ku.classList.add("hidden")}Wr(){this.Xe("pane_free_trial_click");const a=new URL("https://console.cloud.google.com/freetrial");a.searchParams.set("redirectPath",window.location.href);a.searchParams.set("utm_source","ext");a.searchParams.set("utm_medium","partner");a.searchParams.set("utm_campaign","CDR_cma_gcp_cloudshell_freetrial_020222");
a.searchParams.set("utm_content","-");_ds.Bg(window.location,a.toString())}};_ds.x([_ds.tt(".free-trial-banner"),_ds.y("design:type",HTMLElement)],xX.prototype,"Ku",void 0);_ds.x([_ds.tt(".resizer"),_ds.y("design:type",HTMLElement)],xX.prototype,"resizer",void 0);_ds.x([_ds.tt("devsite-shell"),_ds.y("design:type",_ds.JN)],xX.prototype,"yn",void 0);_ds.x([_ds.H({ya:"is-resizing",La:!0,type:Boolean}),_ds.y("design:type",Object)],xX.prototype,"isResizing",void 0);try{customElements.define("cloud-shell-pane",xX)}catch(a){console.warn("Unrecognized DevSite custom element - CloudShellPane",a)};})(_ds_www);
