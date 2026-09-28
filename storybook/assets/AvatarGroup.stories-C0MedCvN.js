import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./jsx-runtime-DqZldVDK.js";import{i as n,t as r}from"./Avatar-Dzh4NXuM.js";import{D as i,E as a,Si as o,wi as s,xi as c}from"./iframe-CI1vGjgx.js";var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w;e((()=>{c(),r(),a(),l=t(),u=[{name:`Alice Johnson`,src:`https://i.pravatar.cc/150?img=1`,key:`alice`},{name:`Bob Smith`,src:`https://i.pravatar.cc/150?img=2`,key:`bob`},{name:`Charlie Davis`,src:`https://i.pravatar.cc/150?img=3`,key:`charlie`},{name:`Diana Lee`,src:`https://i.pravatar.cc/150?img=4`,key:`diana`},{name:`Eve Park`,src:`https://i.pravatar.cc/150?img=5`,key:`eve`}],d={title:`Core/AvatarGroup`,component:s,tags:[`autodocs`],argTypes:{size:{control:`select`,options:[`tiny`,`xsmall`,`small`,`medium`,`large`],description:`Size applied to all child avatars`}}},f={render:()=>(0,l.jsx)(s,{size:`medium`,children:u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key))})},p={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:u.length-3})]})},m={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:u.length-3,onClick:()=>alert(`Show all participants`)})]})},h={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:44})]})},g={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[(0,l.jsx)(n,{src:`https://i.pravatar.cc/150?img=1`,name:`Alice`,status:(0,l.jsx)(i,{variant:`success`,label:`Online`})}),(0,l.jsx)(n,{src:`https://i.pravatar.cc/150?img=2`,name:`Bob`,status:(0,l.jsx)(i,{variant:`warning`,label:`Away`})}),(0,l.jsx)(n,{src:`https://i.pravatar.cc/150?img=3`,name:`Charlie`,status:(0,l.jsx)(i,{variant:`error`,label:`Offline`})})]})},_={render:()=>(0,l.jsx)(`div`,{className:`x78zum5 xdt5ytf x1qh66ti`,children:[`tiny`,`xsmall`,`small`,`medium`,`large`].map(e=>(0,l.jsxs)(`div`,{children:[(0,l.jsx)(`h4`,{className:`xrcdmg7 x9ynric`,children:e}),(0,l.jsxs)(s,{size:e,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:u.length-3})]})]},e))})},v={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,4).map(e=>(0,l.jsx)(n,{name:e.name},e.key)),(0,l.jsx)(o,{count:1})]})},y={render:()=>(0,l.jsx)(s,{size:`medium`,children:(0,l.jsx)(n,{src:`https://i.pravatar.cc/150?img=1`,name:`Alice Johnson`})})},b={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:999})]})},x={render:()=>(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,3).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:0})]})},S={render:()=>(0,l.jsx)(`div`,{style:{width:120,border:`1px dashed grey`,padding:8},children:(0,l.jsxs)(s,{size:`medium`,children:[u.slice(0,5).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:10})]})})},C={render:()=>(0,l.jsxs)(s,{size:`small`,children:[Array.from({length:10},(e,t)=>({key:`user-${t}`,name:`User ${t+1}`,src:`https://i.pravatar.cc/150?img=${t%70+1}`})).map(e=>(0,l.jsx)(n,{src:e.src,name:e.name},e.key)),(0,l.jsx)(o,{count:37})]})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
    </AvatarGroup>
}`,...f.parameters?.docs?.source},description:{story:`Basic avatar group showing all members.`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
      <AvatarGroupOverflow count={USERS.length - 3} />
    </AvatarGroup>
}`,...p.parameters?.docs?.source},description:{story:`Sliced to 3 with "+N" overflow indicator.`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
      <AvatarGroupOverflow count={USERS.length - 3} onClick={() => alert('Show all participants')} />
    </AvatarGroup>
}`,...m.parameters?.docs?.source},description:{story:`Clickable overflow indicator.`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
      <AvatarGroupOverflow count={44} />
    </AvatarGroup>
}`,...h.parameters?.docs?.source},description:{story:`Server-side total count (47 participants, only 3 rendered).`,...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      <Avatar src="https://i.pravatar.cc/150?img=1" name="Alice" status={<StatusDot variant="success" label="Online" />} />
      <Avatar src="https://i.pravatar.cc/150?img=2" name="Bob" status={<StatusDot variant="warning" label="Away" />} />
      <Avatar src="https://i.pravatar.cc/150?img=3" name="Charlie" status={<StatusDot variant="error" label="Offline" />} />
    </AvatarGroup>
}`,...g.parameters?.docs?.source},description:{story:`Per-avatar status dots — just works with compositional API.`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div {...stylex.props(storyStyles.storyWrapper)}>
      {(['tiny', 'xsmall', 'small', 'medium', 'large'] as const).map(size => <div key={size}>
          <h4 {...stylex.props(storyStyles.heading)}>{size}</h4>
          <AvatarGroup size={size}>
            {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
            <AvatarGroupOverflow count={USERS.length - 3} />
          </AvatarGroup>
        </div>)}
    </div>
}`,..._.parameters?.docs?.source},description:{story:`All sizes side by side.`,..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 4).map(u => <Avatar key={u.key} name={u.name} />)}
      <AvatarGroupOverflow count={1} />
    </AvatarGroup>
}`,...v.parameters?.docs?.source},description:{story:`Initials fallback when no images provided.`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      <Avatar src="https://i.pravatar.cc/150?img=1" name="Alice Johnson" />
    </AvatarGroup>
}`,...y.parameters?.docs?.source},description:{story:`Single avatar — no overlap applied.`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
      <AvatarGroupOverflow count={999} />
    </AvatarGroup>
}`,...b.parameters?.docs?.source},description:{story:`Large overflow count (99+).`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <AvatarGroup size="medium">
      {USERS.slice(0, 3).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
      <AvatarGroupOverflow count={0} />
    </AvatarGroup>
}`,...x.parameters?.docs?.source},description:{story:`Zero overflow count edge case.`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 120,
    border: '1px dashed grey',
    padding: 8
  }}>
      <AvatarGroup size="medium">
        {USERS.slice(0, 5).map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
        <AvatarGroupOverflow count={10} />
      </AvatarGroup>
    </div>
}`,...S.parameters?.docs?.source},description:{story:`Narrow container — tests overflow behavior in constrained width.`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => {
    const manyUsers = Array.from({
      length: 10
    }, (_, i) => ({
      key: \`user-\${i}\`,
      name: \`User \${i + 1}\`,
      src: \`https://i.pravatar.cc/150?img=\${i % 70 + 1}\`
    }));
    return <AvatarGroup size="small">
        {manyUsers.map(u => <Avatar key={u.key} src={u.src} name={u.name} />)}
        <AvatarGroupOverflow count={37} />
      </AvatarGroup>;
  }
}`,...C.parameters?.docs?.source},description:{story:`Many avatars — 10+ items to verify overlap stacking.`,...C.parameters?.docs?.description}}},w=[`Default`,`WithOverflow`,`ClickableOverflow`,`ServerSideCount`,`WithStatusDots`,`AllSizes`,`InitialsFallback`,`SingleAvatar`,`LargeOverflowCount`,`ZeroOverflow`,`NarrowContainer`,`ManyAvatars`]}))();export{_ as AllSizes,m as ClickableOverflow,f as Default,v as InitialsFallback,b as LargeOverflowCount,C as ManyAvatars,S as NarrowContainer,h as ServerSideCount,y as SingleAvatar,p as WithOverflow,g as WithStatusDots,x as ZeroOverflow,w as __namedExportsOrder,d as default};