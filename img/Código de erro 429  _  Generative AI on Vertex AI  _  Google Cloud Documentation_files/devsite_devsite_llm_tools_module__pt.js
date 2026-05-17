(function(_ds){var window=this;var Exa=async function(a){a.eventHandler.listen(a,"DropdownToggled",c=>{c=c.getBrowserEvent();let d;a.Da({category:"devsiteLlmTools",action:((d=c.detail)==null?0:d.open)?"llm_tools_dropdown_open":"llm_tools_dropdown_close",label:"dropdown_toggle"})});a.eventHandler.listen(a,"DropdownItemClicked",c=>{c=c.getBrowserEvent();if(c=a.ea.get(c.detail.id))a.Da({category:"devsiteLlmTools",action:c.wz,label:c.analyticsLabel}),c.action()});const b=Dxa();b&&(a.o=b,a.Da({category:"devsiteLlmTools",action:"llm_tools_button_impression"}))},
Dxa=function(){const a=_ds.u();a.pathname=`${a.pathname}.md.txt`;return _ds.fg(a.href)},Fxa=async function(a){if(!a.o)return null;a.hm=!0;try{const b=await fetch(_ds.Oo(a.o.toString()).href);if(b)return await b.text()}catch(b){}finally{a.hm=!1}return null},Gxa=async function(a){try{return a.ma||(a.ma=await Fxa(a)),a.ma}catch(b){}return null},I4=function(a,b){a.dispatchEvent(new CustomEvent("devsite-show-custom-snackbar-msg",{detail:{msg:b,showClose:!1},bubbles:!0}))},Hxa=async function(a){a.Da({category:"devsiteLlmTools",
action:"llm_tools_copy_markdown_click",label:"main_button"});const b=await Gxa(a);b?await _ds.tz(b):I4(a,"Falha ao copiar a p\u00e1gina")},J4=class extends _ds.wC{constructor(){super(...arguments);this.hm=!1;this.eventHandler=new _ds.v;this.ma=null;this.o=void 0;this.items=[{id:"open-markdown",title:"Ver como Markdown",action:()=>{this.o?_ds.rg(window,this.o,"_blank"):I4(this,"Falha ao abrir a visualiza\u00e7\u00e3o do markdown.")},wz:"llm_tools_open_markdown_click",analyticsLabel:"dropdown_item"}];
this.oa=this.items.map(a=>({id:a.id,title:a.title}));this.ea=new Map(this.items.map(a=>[a.id,a]))}Na(){return this}connectedCallback(){super.connectedCallback();Exa(this)}disconnectedCallback(){super.disconnectedCallback();_ds.G(this.eventHandler)}render(){return(0,_ds.N)`
      <div
        class="devsite-llm-tools-container"
        role="group"
        aria-label="${"Ferramentas de LLM"}">
        <div class="devsite-llm-tools-button-container">
          <button
            type="button"
            class="button button-white devsite-llm-tools-button"
            ?disabled="${this.hm}"
            @click=${()=>{Hxa(this)}}
            aria-label="${"Copiar p\u00e1gina como Markdown"}"
            data-title="${"Copiar p\u00e1gina como Markdown"}">
            <span class="material-icons icon-copy" aria-hidden="true"></span>
          </button>
        </div>
        <div class="devsite-llm-tools-dropdown-container">
          <devsite-dropdown-list
            .listItems="${this.oa}"
            open-dropdown-aria-label="${"Mais op\u00e7\u00f5es de ferramentas de LLM"}"
            close-dropdown-aria-label="${"Fechar menu com op\u00e7\u00f5es de ferramentas de LLM"}">
          </devsite-dropdown-list>
        </div>
      </div>
    `}};J4.prototype.disconnectedCallback=J4.prototype.disconnectedCallback;_ds.x([_ds.I(),_ds.y("design:type",Object)],J4.prototype,"hm",void 0);try{customElements.define("devsite-llm-tools",J4)}catch(a){console.warn("Unrecognized DevSite custom element - DevsiteLlmTools",a)};})(_ds_www);
