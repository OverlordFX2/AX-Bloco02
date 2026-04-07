import { useState, useEffect, useMemo } from "react";

const A = v => Array.isArray(v) ? v : [];
const O = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
const slug = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const C = { bg:"#09090B", c:"#17171C", b:"#27272F", bh:"#B20710", t:"#ECECEE", ts:"#A1A1AB", td:"#5C5C68", r:"#B20710", rs:"#E05555", rg:"rgba(178,7,16,.10)", g:"#10B981", y:"#F59E0B", bl:"#3B82F6", cy:"#06B6D4", go:"#C5A55A", pu:"#9B7BF5" };
const MS = { "Alta":85, "Média":50, "Baixa":20, "A validar com cliente":40 };
const BV = { "Estrela":90, "Vaca Leiteira":70, "Incógnita":40, "Abacaxi":15 };
const QD = (mx,my) => mx>=50&&my>=50?"💰 Cash Machine":mx>=50&&my<50?"🚀 Growth Bet":mx<50&&my>=50?"📦 Volume Play":"🔍 Rever";

function xJSON(raw) {
  if (!raw?.trim()) return null;
  let s = raw.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
  const i = s.indexOf("{"); if (i<0) return null; if (i>0) s=s.slice(i);
  try { return JSON.parse(s); } catch {}
  let r = s.replace(/,\s*([}\]])/g,"$1");
  let ob=0,oa=0,q=false,esc=false;
  for (const ch of r) { if(esc){esc=false;continue} if(ch==="\\"){esc=true;continue} if(ch==='"'){q=!q;continue} if(q)continue; if(ch==="{")ob++; if(ch==="}")ob--; if(ch==="[")oa++; if(ch==="]")oa--; }
  if(q)r+='"'; for(let j=0;j<oa;j++)r+="]"; for(let j=0;j<ob;j++)r+="}";
  try { return JSON.parse(r); } catch {} return null;
}
function compressImg(b64,mime) {
  return new Promise(resolve => {
    const img=new Image();
    img.onload=()=>{ const MAX=800;let w=img.width,h=img.height; if(w>MAX||h>MAX){const rt=Math.min(MAX/w,MAX/h);w=Math.round(w*rt);h=Math.round(h*rt)} const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);resolve(cv.toDataURL("image/jpeg",0.6).split(",")[1]); };
    img.onerror=()=>resolve(b64); img.src=`data:${mime};base64,${b64}`;
  });
}
function extract(obj,key,fbs=[]){ if(obj&&obj[key]!==undefined)return obj[key]; for(const fb of fbs){if(obj&&obj[fb]!==undefined)return obj[fb]} return undefined; }

function genMD(d) {
  try {
    if(!d) return "Sem dados";
    const nome=d.nome||d.cliente||"Cliente";
    const dt=new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const cc=O(d.produto_carro_chefe);const prods=A(d.produtos);const mix=O(d.mix_resumo);
    const prodTable=prods.length?`| # | Produto | Categoria | Ticket | Modelo | BCG | Público |\n|---|---|---|---|---|---|---|\n${prods.map((p,i)=>`| ${i+1} | ${p.nome||''} | ${p.categoria||''} | ${p.preco_ou_ticket||'—'} | ${p.modelo_venda||''} | ${p.nivel_maturidade||'—'} | ${p.publico_alvo||'—'} |`).join('\n')}\n`:'';
    const mapTable=prods.length?`| Produto | Margem | BCG | Modelo | Quadrante |\n|---|---|---|---|---|\n${prods.map(p=>`| ${p.nome||''} | ${p.margem_estimada||'—'} | ${p.nivel_maturidade||'—'} | ${p.modelo_venda||'—'} | ${QD(MS[p.margem_estimada]||40,BV[p.nivel_maturidade]||40)} |`).join('\n')}\n`:'';
    const diffs=prods.flatMap(p=>A(p.diferenciais_competitivos).map(x=>`- ${x} *(${p.nome})*`));
    const risks=prods.flatMap(p=>A(p.pontos_fracos_ou_riscos).map(x=>`- ${x} *(${p.nome})*`));
    const comp=A(d.tabela_comparativa).length?`| Atributo | Posição Cliente | Mercado | Vant. |\n|---|---|---|---|\n${d.tabela_comparativa.map(r=>`| ${r.atributo||''} | ${r.posicao_cliente||r.cliente||''} | ${r.mercado||''} | ${r.vantagem?'✓':'—'} |`).join('\n')}\n`:'';
    const opps=A(d.oportunidades).map(o=>`- **${typeof o==='string'?o:o.oportunidade||''}** ${o.impacto?`[${o.impacto}/${o.facilidade}]`:''}`).join('\n');
    const gaps=A(d.gaps).map(g=>`- **${typeof g==='string'?g:g.informacao||''}**${g.por_que_importa?` — ${g.por_que_importa}`:''}`).join('\n');
    const notas=A(d._notas_estimativas).map(n=>`- ⚡ **${n.campo||''}** → ${n.valor_estimado||''} [${typeof n.confianca==='number'?Math.round(n.confianca*100)+'%':n.confianca}] — ${n.como_validar||n.recomendacao||''}`).join('\n');
    const aprs=A(d.aprendizados).map(a=>`- **${a.insight||''}**${a.impacto_no_negocio?` — ${a.impacto_no_negocio}`:''}${a.recomendacao?` → ${a.recomendacao}`:''}`).join('\n');
    const area=O(d.area_atuacao);
    const areaMD=area.geografica?`**Geográfica:** ${area.geografica}\n**Canais:** ${A(area.canais_distribuicao).join(', ')||'—'}\n**Entrega:** ${area.modelo_entrega||'—'}`:'A validar com cliente';
    return `# Bloco 2 — Resumo para Knowledge Base\n## ${nome}${d.segmento?` (${d.segmento})`:''}\n\n**V4 Company** · ${dt} · ID: ${d.client_id||slug(nome)}\n\n---\n\n## Resumo Executivo\n\n${d.resumo_executivo||''}\n\n---\n\n## Catálogo\n\n${cc.nome?`🏆 **Carro-chefe: ${cc.nome}** — ${cc.por_que||''}${cc.percentual_receita_estimado?` (${cc.percentual_receita_estimado})`:''}\n\n`:''}**Mix:** ${mix.total_produtos||prods.length} produtos · ${mix.recorrentes||0} recorrentes · Ticket médio: ${mix.ticket_medio_geral||'—'}\n\n${prodTable}\n### Product-Revenue Map\n\n${mapTable}\n---\n\n## Posição Competitiva\n\n${diffs.length?`**Diferenciais**\n${diffs.join('\n')}\n\n`:''}${risks.length?`**Riscos**\n${risks.join('\n')}\n\n`:''}${comp?`**Comparativa**\n\n${comp}\n`:''}---\n\n## Área de Atuação\n\n${areaMD}\n\n---\n\n## Oportunidades & Gaps\n\n${opps?`**Oportunidades**\n${opps}\n\n`:''}${gaps?`**Gaps**\n${gaps}\n\n`:''}${notas?`**⚡ Estimativas**\n${notas}\n\n`:''}${aprs?`**Aprendizados**\n${aprs}\n\n`:''}---\n\n*Bloco 2 · V4 Intelligence*\n`;
  } catch(err){ return `# Erro\n\n${err.message}`; }
}

function genInput(d) {
  try {
    if(!d) return "Sem dados";
    const nome=d.nome||d.cliente||"Cliente";
    const prods=A(d.produtos);const cc=O(d.produto_carro_chefe);const mix=O(d.mix_resumo);const area=O(d.area_atuacao);
    const prodLines=prods.map(p=>`- ${p.nome||''} [${p.categoria||''}, ${p.modelo_venda||''}, ${p.preco_ou_ticket||'—'}, BCG:${p.nivel_maturidade||'—'}]: Fortes: ${A(p.pontos_fortes).join('; ')} | Fracos: ${A(p.pontos_fracos_ou_riscos).join('; ')} | Dif: ${A(p.diferenciais_competitivos).join('; ')}`).join('\n');
    const puvs=A(d.puvs).slice(0,5);const args=A(d.argumentos_de_venda).slice(0,5);const comp=A(d.tabela_comparativa);
    const lines=[`=== BLOCO 2: ${nome} (${d.segmento||''}) ===`,`ID: ${d.client_id||slug(nome)}`,`Resumo: ${d.resumo_executivo||''}`,`Carro-chefe: ${cc.nome||'?'} (${cc.percentual_receita_estimado||'?'}) — ${cc.por_que||''}`,`Mix: ${mix.total_produtos||prods.length} produtos · ${mix.recorrentes||0} recorrentes · ${mix.avulsos||0} avulsos · Ticket: ${mix.ticket_medio_geral||'?'} · ${mix.concentracao||''}`,'','PRODUTOS:',prodLines];
    const mapLines=prods.map(p=>`${p.nome} → ${QD(MS[p.margem_estimada]||40,BV[p.nivel_maturidade]||40)}`);
    lines.push('','MATRIZ:');mapLines.forEach(l=>lines.push(l));
    if(puvs.length){lines.push('','PUVs:');puvs.forEach(p=>lines.push(`- "${p.proposta}" → ${p.para_quem} (Prova: ${p.prova})`));}
    if(args.length){lines.push('','ARGUMENTOS:');args.forEach(a=>lines.push(`- "${a.argumento}" → Quando: ${a.contexto} | Quebra: ${a.objecao_que_quebra}`));}
    if(comp.length){lines.push('','COMPARATIVA:');comp.forEach(c=>lines.push(`- ${c.atributo}: ${c.posicao_cliente||c.cliente||''} vs ${c.mercado} [${c.vantagem?'✓':'✗'}]`));}
    if(area.geografica)lines.push(`\nÁrea: ${area.geografica} · Canais: ${A(area.canais_distribuicao).join(', ')} · Entrega: ${area.modelo_entrega||''}`);
    const opps=A(d.oportunidades);if(opps.length){lines.push('','OPORTUNIDADES:');opps.forEach(o=>lines.push(`→ ${typeof o==='string'?o:o.oportunidade} [${o.impacto||''}]`));}
    const gaps=A(d.gaps);if(gaps.length){lines.push('','GAPS:');gaps.forEach(g=>lines.push(`? ${typeof g==='string'?g:g.informacao}`));}
    const aprs=A(d.aprendizados);if(aprs.length){lines.push('','APRENDIZADOS:');aprs.forEach(a=>lines.push(`💡 ${a.insight}${a.recomendacao?' → '+a.recomendacao:''}`));}
    return lines.join('\n');
  } catch(err){ return `Erro: ${err.message}`; }
}

export default function B2(){
  const[screen,setScreen]=useState("input");
  const[name,setName]=useState("");const[segmento,setSegmento]=useState("");const[regiao,setRegiao]=useState("");const[links,setLinks]=useState("");const[raw,setRaw]=useState("");const[b1,setB1]=useState("");const[files,setFiles]=useState([]);
  const[result,setResult]=useState(null);const[err,setErr]=useState(null);const[msg,setMsg]=useState("");
  const[tab,setTab]=useState("json");const[copiedBtn,setCopiedBtn]=useState(null);
  const[log,setLog]=useState([]);const[showLog,setShowLog]=useState(false);const[tokenStats,setTokenStats]=useState(null);
  const[subMsg,setSubMsg]=useState("");
  useEffect(()=>{if(screen!=="loading")return;const subs=["Analisando...","Processando...","Estruturando...","Montando..."];let i=0;setSubMsg(subs[0]);const iv=setInterval(()=>{i=(i+1)%subs.length;setSubMsg(subs[i])},2200);return()=>clearInterval(iv)},[screen]);
  useEffect(()=>{if(screen!=="loading")return;const s=Date.now();const iv=setInterval(()=>{const el=document.getElementById("elapsed");if(el)el.textContent=Math.round((Date.now()-s)/1000)},1000);return()=>clearInterval(iv)},[screen]);

  const normalize=(parsed)=>{
    let d=parsed.produto_oferta||parsed;
    if(!d.nome&&d.cliente){d.nome=d.cliente;delete d.cliente}
    if(!d.client_id)d.client_id=slug(d.nome||name);
    if(!d.segmento&&segmento)d.segmento=segmento;
    if(!d.data_geracao)d.data_geracao=new Date().toISOString().split('T')[0];
    if(d.catalogo_produtos){const cat=O(d.catalogo_produtos);if(cat.produtos)d.produtos=cat.produtos;if(cat.carro_chefe)d.produto_carro_chefe=cat.carro_chefe;d.mix_resumo={total_produtos:cat.total_produtos||0,recorrentes:cat.recorrentes||0,avulsos:cat.avulsos||0,ticket_medio_geral:cat.ticket_medio_geral||"",concentracao:cat.concentracao||""}}
    A(d.produtos).forEach(p=>{if(!p.id)p.id=slug(p.nome)||`prod-${Math.random().toString(36).slice(2,8)}`});
    A(d.tabela_comparativa).forEach(r=>{if(r.cliente&&!r.posicao_cliente){r.posicao_cliente=r.cliente;delete r.cliente}});
    A(d._notas_estimativas).forEach(n=>{
      if(n.recomendacao&&!n.como_validar){n.como_validar=n.recomendacao;delete n.recomendacao}
      if(typeof n.confianca==='string'){n.confianca={alta:0.85,media:0.55,baixa:0.25}[n.confianca]||0.5}
    });
    d._raw=parsed;return d;
  };
  function expJSON(d){
    if(!d)return"{}";
    const nm=d.nome||d.cliente||name||"";
    const{_raw,mix_resumo,produto_carro_chefe,produtos,_notas_estimativas,aprendizados,cliente,...rest}=d;
    const out={produto_oferta:{
      client_id:d.client_id||slug(nm),nome:nm,segmento:d.segmento||segmento||"",data_geracao:d.data_geracao||new Date().toISOString().split('T')[0],
      resumo_executivo:rest.resumo_executivo||"",
      catalogo_produtos:{total_produtos:A(produtos).length,recorrentes:A(produtos).filter(p=>p.modelo_venda==="Recorrente").length,avulsos:A(produtos).filter(p=>p.modelo_venda==="Avulso").length,ticket_medio_geral:mix_resumo?.ticket_medio_geral||"",concentracao:mix_resumo?.concentracao||"",carro_chefe:produto_carro_chefe||null,produtos:A(produtos)},
      puvs:A(rest.puvs),argumentos_de_venda:A(rest.argumentos_de_venda),tabela_comparativa:A(rest.tabela_comparativa),area_atuacao:O(rest.area_atuacao),oportunidades:A(rest.oportunidades),gaps:A(rest.gaps),
    }};
    if(A(aprendizados).length)out.produto_oferta.aprendizados=aprendizados;
    if(A(_notas_estimativas).length)out.produto_oferta._notas_estimativas=_notas_estimativas;
    return JSON.stringify(out,null,2);
  }
  const memoMD=useMemo(()=>{try{return result?genMD(result):''}catch{return''}},[result]);
  const memoInput=useMemo(()=>{try{return result?genInput(result):''}catch{return''}},[result]);
  const memoJSON=useMemo(()=>{try{return result?expJSON(result):'{}'}catch{return'{}'}},[result]);
  const getExport=(t)=>t==="json"?memoJSON:t==="md"?memoMD:t==="input"?memoInput:"";
  const copy=(t)=>{try{navigator.clipboard.writeText(getExport(t));setCopiedBtn(t);setTimeout(()=>setCopiedBtn(null),2000)}catch{}};

  const handleFiles=async(ev)=>{
    const nf=[];for(const f of ev.target.files){try{
      if(/\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)){if(f.size>8e6)continue;let b=await new Promise((r,j)=>{const rd=new FileReader();rd.onload=()=>r(rd.result.split(",")[1]);rd.onerror=j;rd.readAsDataURL(f)});b=await compressImg(b,f.type||"image/jpeg");nf.push({name:f.name,type:"image",media_type:"image/jpeg",data:b});}
      else if(/\.pdf$/i.test(f.name)){if(f.size>10e6)continue;const b=await new Promise((r,j)=>{const rd=new FileReader();rd.onload=()=>r(rd.result.split(",")[1]);rd.onerror=j;rd.readAsDataURL(f)});nf.push({name:f.name,type:"pdf",data:b});}
      else{nf.push({name:f.name,type:"text",content:(await f.text()).slice(0,15000)});}
    }catch{}}setFiles(prev=>[...prev,...nf]);ev.target.value="";
  };
  const buildMsg=()=>{
    const parts=[];
    for(const f of files){if(f.type==="image")parts.push({type:"image",source:{type:"base64",media_type:f.media_type,data:f.data}},{type:"text",text:`[Img: ${f.name}]`});else if(f.type==="pdf")parts.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.data}},{type:"text",text:`[PDF: ${f.name}]`})}
    let u=`CLIENTE: ${name||"?"}\nSEGMENTO: ${segmento||"?"}\nREGIÃO: ${regiao||"?"}\n\n`;
    if(b1.trim())u+=`CONTEXTO BLOCOS ANTERIORES:\n${b1}\n\n`;if(links.trim())u+=`LINKS:\n${links}\n\n`;
    const tf=files.filter(f=>f.type==="text");if(tf.length)u+=`ARQUIVOS:\n${tf.map(f=>`--- ${f.name} ---\n${f.content}`).join('\n\n')}\n\n`;
    if(raw.trim())u+=`INFO:\n${raw}\n\n`;u+="Gere o dossiê em JSON.";
    parts.push({type:"text",text:u});return parts.length===1?u:parts;
  };
  const SYS=[
    `V4 — B2 ETAPA 1/4: Catálogo.\nJSON: client_id(slug),nome,segmento,data_geracao(YYYY-MM-DD),resumo_executivo(3 frases),catalogo_produtos{total_produtos,recorrentes,avulsos,ticket_medio_geral,concentracao,carro_chefe{nome,por_que,percentual_receita_estimado},produtos[]}.\nProduto: id(slug!),nome,categoria,descricao(2 frases),preco_ou_ticket,margem_estimada("Alta"|"Média"|"Baixa"|"A validar com cliente"),modelo_venda("Recorrente"|"Avulso"|"Projeto"|"Híbrido"),ciclo_venda,sazonalidade,publico_alvo,nivel_maturidade("Estrela"|"Vaca Leiteira"|"Incógnita"|"Abacaxi"),pontos_fortes[],pontos_fracos_ou_riscos[],diferenciais_competitivos[],data_adicionado,fonte,status.\nNUNCA INVENTAR. Sem dado→"A validar com cliente". Estimativas: ⚡. UTF-8.`,
    `V4 — B2 ETAPA 2/4: PUVs e Argumentos.\nJSON: puvs[]{proposta(max 15 palavras),para_quem,prova,uso_recomendado}. argumentos_de_venda[]{argumento(max 25 palavras),contexto,objecao_que_quebra,canal}.`,
    `V4 — B2 ETAPA 3/4: Competição.\nJSON: tabela_comparativa[]{atributo,posicao_cliente,mercado,vantagem(bool)}. area_atuacao{geografica,canais_distribuicao[],modelo_entrega}. oportunidades[]{oportunidade,impacto,facilidade}. gaps[]{informacao,por_que_importa,como_obter}.\nUse "posicao_cliente" NÃO "cliente".`,
    `V4 — B2 ETAPA 4/4: Meta.\nJSON: aprendizados[]{insight,impacto_no_negocio,recomendacao}. _notas_estimativas[]{campo,valor_estimado(⚡),raciocinio,confianca(NÚMERO 0.0-1.0),como_validar}.\nSe vazio: {"aprendizados":[],"_notas_estimativas":[]}.`
  ];
  const SL=["1/4 Produtos","2/4 PUVs","3/4 Competição","4/4 Meta"];
  const SP=['{"client_id":"'+(slug(name)||'x')+'","nome":"'+(name||'')+'","segmento":"'+(segmento||'')+'","data_geracao":"'+new Date().toISOString().split('T')[0]+'","resumo_executivo":"','{"puvs":[','{"tabela_comparativa":[','{"aprendizados":['];

  const go=async()=>{
    if(!raw.trim()&&!links.trim()&&!b1.trim()&&files.length===0)return;
    setScreen("loading");setErr(null);setLog([]);setShowLog(false);setTokenStats(null);setTab("json");
    const t0=Date.now();
    const lg=(e)=>setLog(prev=>[...prev,{...e,ts:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}]);
    try{
      const content=buildMsg();
      let base=`CLIENTE: ${name||"?"}\nSEGMENTO: ${segmento||"?"}\nREGIÃO: ${regiao||"?"}\n`;
      if(b1.trim())base+=`\nCONTEXTO:\n${b1}\n`;if(links.trim())base+=`\nLINKS:\n${links}\n`;
      const tf=files.filter(f=>f.type==="text");if(tf.length)base+=`\nARQ:\n${tf.map(f=>`--- ${f.name} ---\n${f.content}`).join('\n\n')}\n`;
      if(raw.trim())base+=`\nINFO:\n${raw}\n`;

      const call=async(idx,uc,rc=0)=>{
        setMsg(`${SL[idx]}${rc?' ↻'+rc:''}...`);lg({type:"api",msg:`${SL[idx]}${rc?' ↻'+rc:''}`});
        const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:16000,system:SYS[idx],messages:[{role:"user",content:uc},{role:"assistant",content:SP[idx]}]})});
        if(!r.ok){const e=await r.json().catch(()=>({}));lg({type:"error",msg:`❌ ${SL[idx]}: ${e.error?.message||r.status}`});if(rc<2)return call(idx,uc,rc+1);throw new Error(`${SL[idx]}: ${e.error?.message||r.status}`);}
        const j=await r.json();const iT=j.usage?.input_tokens||0,oT=j.usage?.output_tokens||0,st=j.stop_reason||'?';
        const rawT=j.content?.map(c=>c.text||"").join("")||"";
        lg({type:"ok",msg:`✅ ${SL[idx]}: ${iT}→${oT} ${st}`});
        const parsed=xJSON(SP[idx]+rawT);
        if(!parsed){lg({type:"error",msg:`${SL[idx]} JSON fail`});if(rc<2)return call(idx,uc,rc+1);}
        return{data:parsed,tokens:{input:iT,output:oT,stop:st}};
      };

      const r1=await call(0,content);if(!r1?.data)throw new Error("E1 fail");
      const prods=A(extract(r1.data,'produtos'))||A(O(r1.data.catalogo_produtos).produtos);
      const pl=prods.map(p=>`- ${p.nome}: ${p.categoria||''}, ${p.preco_ou_ticket||''}`).join('\n');
      const r2=await call(1,`${base}\nPRODUTOS:\n${pl}\nGere PUVs e argumentos.`);if(!r2?.data)throw new Error("E2 fail");
      const pvl=A(r2.data.puvs).slice(0,5).map(p=>`"${p.proposta}"`).join(', ');
      const r3=await call(2,`${base}\nPRODUTOS:\n${pl}\nPUVs: ${pvl}\nGere comparativa (posicao_cliente), área, oportunidades, gaps.`);
      const r4=await call(3,`${base}\nPRODUTOS:\n${pl}\nVANTAGENS: ${A(r3?.data?.tabela_comparativa).filter(r=>r.vantagem).map(r=>r.atributo).join(', ')||'?'}\nGAPS: ${A(r3?.data?.gaps).map(g=>g.informacao||g).join(', ')||'?'}\nGere aprendizados e estimativas.`);

      const sr=[r1,r2,r3,r4];
      setTokenStats({stages:sr.map(r=>r?.tokens||null),totalIn:sr.reduce((s,r)=>s+(r?.tokens?.input||0),0),totalOut:sr.reduce((s,r)=>s+(r?.tokens?.output||0),0),total:sr.reduce((s,r)=>s+(r?.tokens?.input||0)+(r?.tokens?.output||0),0)});

      const merged={produto_oferta:{
        client_id:extract(r1.data,'client_id')||slug(name),nome:extract(r1.data,'nome',['cliente'])||name||"",segmento:extract(r1.data,'segmento')||segmento||"",data_geracao:extract(r1.data,'data_geracao')||new Date().toISOString().split('T')[0],
        resumo_executivo:extract(r1.data,'resumo_executivo')||"",
        catalogo_produtos:extract(r1.data,'catalogo_produtos')||{produtos:prods,total_produtos:prods.length,recorrentes:0,avulsos:0,ticket_medio_geral:"",concentracao:"",carro_chefe:null},
        puvs:A(extract(r2.data,'puvs')),argumentos_de_venda:A(extract(r2.data,'argumentos_de_venda',['argumentos'])),
        tabela_comparativa:A(r3?.data?.tabela_comparativa),area_atuacao:O(r3?.data?.area_atuacao),oportunidades:A(r3?.data?.oportunidades),gaps:A(r3?.data?.gaps),
        ...(A(r4?.data?.aprendizados).length?{aprendizados:r4.data.aprendizados}:{}),
        ...(A(r4?.data?._notas_estimativas).length?{_notas_estimativas:r4.data._notas_estimativas}:{}),
      }};
      const n=normalize(merged);
      lg({type:"ok",msg:`🏁 ${A(n.produtos).length}prod ${A(n.puvs).length}puv ${A(n.argumentos_de_venda).length}arg · ${((Date.now()-t0)/1000).toFixed(1)}s`});
      setResult(n);setScreen("result");
    }catch(e){lg({type:"error",msg:`❌ ${e.message}`});setErr(e.message);setScreen("input");}
  };

  const S={
    base:{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',-apple-system,sans-serif",color:C.t},
    inp:{width:"100%",padding:"12px 16px",background:C.c,border:`1px solid ${C.b}`,borderRadius:"8px",color:C.t,fontSize:"13px",lineHeight:"1.6",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"},
    lbl:{display:"block",fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"},
    hdr:{padding:"16px 28px",borderBottom:`1px solid ${C.b}`,display:"flex",alignItems:"center",gap:"14px"},
    logo:{width:"34px",height:"34px",borderRadius:"8px",background:`linear-gradient(135deg,${C.r},#6B0008)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:800,color:"#fff"},
    copyBtn:(c,active)=>({padding:"10px 20px",background:active?C.g:C.c,border:`1px solid ${active?C.g:c}40`,borderRadius:"8px",color:active?"#fff":c,fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}),
    tab:(active,c)=>({padding:"12px 20px",background:"none",border:"none",borderBottom:active?`2px solid ${c}`:"2px solid transparent",color:active?C.t:C.td,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}),
    pre:{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:C.ts,lineHeight:"1.6",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,userSelect:"all"},
  };

  // ─── INPUT ───
  if(screen==="input"){
    const ok=raw.trim()||links.trim()||b1.trim()||files.length>0;
    return(<div style={S.base}>
      <div style={S.hdr}><div style={S.logo}>B2</div><div><h1 style={{margin:0,fontSize:"15px",fontWeight:700}}>Bloco 2 — Produto & Oferta</h1><p style={{margin:0,fontSize:"11px",color:C.td}}>Light · JSON + MD + INPUT</p></div></div>
      <div style={{maxWidth:"820px",margin:"0 auto",padding:"32px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          <div><label style={{...S.lbl,color:C.td}}>Nome do Cliente</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Horizonte Solar" style={{...S.inp,resize:"none"}} onFocus={e=>e.target.style.borderColor=C.bh} onBlur={e=>e.target.style.borderColor=C.b}/></div>
          <div><label style={{...S.lbl,color:C.td}}>Segmento</label><input value={segmento} onChange={e=>setSegmento(e.target.value)} placeholder="Ex: Energia Solar B2C" style={{...S.inp,resize:"none"}} onFocus={e=>e.target.style.borderColor=C.bh} onBlur={e=>e.target.style.borderColor=C.b}/></div>
          <div><label style={{...S.lbl,color:C.td}}>Região</label><input value={regiao} onChange={e=>setRegiao(e.target.value)} placeholder="Ex: Centro-Oeste" style={{...S.inp,resize:"none"}} onFocus={e=>e.target.style.borderColor=C.bh} onBlur={e=>e.target.style.borderColor=C.b}/></div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{...S.lbl,color:C.cy}}>🔗 Links e Arquivos</label>
          <textarea value={links} onChange={e=>setLinks(e.target.value)} placeholder="Um link por linha..." style={{...S.inp,minHeight:"70px",borderColor:C.cy+"30"}} onFocus={e=>e.target.style.borderColor=C.cy} onBlur={e=>e.target.style.borderColor=C.cy+"30"}/>
          <div style={{display:"flex",gap:"8px",alignItems:"center",marginTop:"8px",flexWrap:"wrap"}}>
            <label style={{padding:"6px 14px",background:C.c,border:`1px solid ${C.cy}40`,borderRadius:"6px",color:C.cy,fontSize:"12px",fontWeight:600,cursor:"pointer"}}>📎 Anexar<input type="file" multiple accept=".txt,.md,.csv,.json,.html,.pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFiles} style={{display:"none"}}/></label>
            {files.map((f,i)=><span key={i} style={{fontSize:"11px",padding:"4px 10px",borderRadius:"4px",background:C.cy+"15",color:C.cy,cursor:"pointer"}} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}>{f.name} ✕</span>)}
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{...S.lbl,color:C.go}}>Contexto dos Blocos Anteriores</label>
          <textarea value={b1} onChange={e=>setB1(e.target.value)} placeholder="Cole o INPUT do B1 aqui..." style={{...S.inp,minHeight:"100px",fontFamily:"monospace",fontSize:"11px",borderColor:C.go+"30"}} onFocus={e=>e.target.style.borderColor=C.go} onBlur={e=>e.target.style.borderColor=C.go+"30"}/>
          <div style={{display:"flex",gap:"8px",alignItems:"center",marginTop:"6px"}}>
            <label style={{padding:"5px 12px",background:C.c,border:`1px solid ${C.go}40`,borderRadius:"6px",color:C.go,fontSize:"11px",fontWeight:600,cursor:"pointer"}}>📎 .json/.md/.txt<input type="file" accept=".json,.md,.txt" onChange={async(ev)=>{try{const f=ev.target.files[0];if(f)setB1((await f.text()).slice(0,50000));ev.target.value=""}catch{}}} style={{display:"none"}}/></label>
            {b1.trim()&&<span style={{fontSize:"11px",color:C.go}}>✓ {b1.length} chars</span>}
          </div>
        </div>
        <div style={{marginBottom:"16px"}}><label style={{...S.lbl,color:C.td}}>Info do Account Manager</label><textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder="Produtos, preços, diferenciais, concorrentes..." style={{...S.inp,minHeight:"200px"}} onFocus={e=>e.target.style.borderColor=C.bh} onBlur={e=>e.target.style.borderColor=C.b}/></div>
        {err&&<div style={{background:C.rg,border:`1px solid ${C.r}40`,borderRadius:"8px",padding:"12px 16px",marginBottom:"14px"}}><p style={{fontSize:"13px",color:C.rs,margin:0}}>⚠ {err}</p></div>}
        {err&&log.length>0&&<div style={{background:C.c,border:`1px solid ${C.b}`,borderRadius:"8px",padding:"12px",marginBottom:"14px",maxHeight:"200px",overflow:"auto"}}><pre style={S.pre}>{log.map(l=>`${l.ts} ${l.msg}`).join('\n')}</pre></div>}
        <button onClick={go} disabled={!ok} style={{width:"100%",padding:"16px",background:ok?`linear-gradient(135deg,${C.r},#6B0008)`:C.c,border:ok?"none":`1px solid ${C.b}`,borderRadius:"8px",color:ok?"#fff":C.td,fontSize:"15px",fontWeight:700,cursor:ok?"pointer":"not-allowed",fontFamily:"inherit"}}>Gerar (4 etapas)</button>
      </div>
    </div>);
  }

  // ─── LOADING ───
  if(screen==="loading"){
    const sn=msg.startsWith("1/")?1:msg.startsWith("2/")?2:msg.startsWith("3/")?3:msg.startsWith("4/")?4:0;
    return(<div style={{...S.base,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes br{0%,100%{opacity:.9}50%{opacity:1}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{...S.logo,width:56,height:56,borderRadius:14,fontSize:22,margin:"0 auto 20px",animation:"br 2s infinite"}}><span>B2</span></div>
        <p style={{fontSize:"14px",fontWeight:600,color:C.t,marginBottom:"12px"}}>{msg}</p>
        {sn>0&&<div style={{display:"flex",gap:"4px",justifyContent:"center",marginBottom:"12px"}}>{[1,2,3,4].map(s=><div key={s} style={{width:50,height:4,borderRadius:2,background:s<sn?C.g:s===sn?C.r:C.b}}/>)}</div>}
        <p style={{fontSize:"11px",color:C.td}}>{subMsg} · <span id="elapsed">0</span>s</p>
      </div>
    </div>);
  }

  // ─── RESULT: 3 text panels ───
  const PANELS=[{id:"json",l:"📋 JSON",c:C.r,d:"Knowledge Base"},{id:"md",l:"📋 MD",c:C.go,d:"Resumo"},{id:"input",l:"📋 INPUT",c:C.bl,d:"Blocos 3-7"}];
  const nP=A(result?.produtos).length;const nPv=A(result?.puvs).length;const nA=A(result?.argumentos_de_venda).length;

  return(<div style={S.base}>
    <div style={{...S.hdr,justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}><div style={{...S.logo,width:30,height:30,borderRadius:6,fontSize:12}}>B2</div>
        <div><h1 style={{margin:0,fontSize:"14px",fontWeight:700}}>{result?.nome||result?.cliente||name}</h1>
          <p style={{margin:0,fontSize:"11px",color:C.td}}>{nP} prod · {nPv} puv · {nA} arg · {result?.client_id||''}{tokenStats?` · ${tokenStats.total.toLocaleString()} tok`:''}</p>
        </div>
      </div>
      <button onClick={()=>{setScreen("input");setResult(null);setLog([]);setTokenStats(null)}} style={{padding:"7px 14px",background:C.c,border:`1px solid ${C.b}`,borderRadius:"6px",color:C.ts,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Novo</button>
    </div>

    {/* Copy buttons */}
    <div style={{display:"flex",gap:"10px",padding:"20px 28px",borderBottom:`1px solid ${C.b}`}}>
      {PANELS.map(p=><button key={p.id} onClick={()=>copy(p.id)} style={S.copyBtn(p.c,copiedBtn===p.id)}>{copiedBtn===p.id?"✓ Copiado!":p.l}</button>)}
    </div>

    {/* Tabs */}
    <div style={{display:"flex",padding:"0 28px",borderBottom:`1px solid ${C.b}`}}>
      {PANELS.map(p=><button key={p.id} onClick={()=>setTab(p.id)} style={S.tab(tab===p.id,p.c)}>{p.l.replace("📋 ","")} <span style={{fontSize:"10px",color:C.td,marginLeft:"6px"}}>{Math.round(getExport(p.id).length/1024)}KB</span></button>)}
      <button onClick={()=>setShowLog(!showLog)} style={S.tab(showLog,C.td)}>Log ({log.length})</button>
    </div>

    {/* Content */}
    <div style={{padding:"20px 28px",maxHeight:"calc(100vh - 180px)",overflow:"auto"}}>
      {tokenStats&&<div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        {A(tokenStats.stages).map((s,i)=>s&&<div key={i} style={{background:C.c,border:`1px solid ${C.b}`,borderRadius:"6px",padding:"6px 12px",fontSize:"10px",color:C.ts,fontFamily:"monospace"}}><span style={{color:C.r,fontWeight:700}}>E{i+1}</span> {s.input}→{s.output} {s.stop==='max_tokens'?'⚠':'✓'}</div>)}
        <div style={{background:C.c,border:`1px solid ${C.r}30`,borderRadius:"6px",padding:"6px 12px",fontSize:"10px",fontFamily:"monospace",color:C.t,fontWeight:700}}>Σ {tokenStats.total.toLocaleString()}</div>
      </div>}

      {!showLog&&<pre style={S.pre}>{getExport(tab)}</pre>}
      {showLog&&<pre style={{...S.pre,color:C.td}}>{log.map(l=>{const c=l.type==="ok"?"#10B981":l.type==="error"?"#E05555":l.type==="warn"?"#F59E0B":"#A1A1AB";return `\x1b[${c}]${l.ts} ${l.msg}`}).join('\n').replace(/\x1b\[([^\]]+)\]/g,'')}</pre>}
    </div>
  </div>);
}
