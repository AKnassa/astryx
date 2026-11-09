import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./jsx-runtime-DqZldVDK.js";import{t as n}from"./Divider-CyxlzlSx.js";import{t as r}from"./Divider-keWi-KmE.js";import{r as i}from"./renderDropdownItems-DipTUxvf.js";import{n as a,t as o}from"./ContextMenu-DXSDfoUP.js";import{A as s,I as c,Jt as l,Kt as u,Mn as d,Mt as f,O as p,m,t as h}from"./esm-DA7gAIBC.js";var g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{o(),r(),h(),g=t(),_={title:`Core/ContextMenu`,component:a,tags:[`autodocs`],parameters:{layout:`centered`},argTypes:{items:{description:`Menu items (items, dividers, or sections)`},menuWidth:{control:`text`,description:`Custom menu width (number for px or CSS string)`},size:{control:`select`,options:[`sm`,`md`,`lg`],description:`Menu item size`},isDisabled:{control:`boolean`,description:`Disable custom context menu`},"data-testid":{control:`text`,description:`Test ID for testing frameworks`}}},v={render:()=>(0,g.jsx)(a,{items:[{label:`Cut`,onClick:()=>console.log(`Cut`)},{label:`Copy`,onClick:()=>console.log(`Copy`)},{label:`Paste`,onClick:()=>console.log(`Paste`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click this area`})})},y={render:()=>(0,g.jsx)(a,{items:[{label:`Cut`,icon:s,onClick:()=>console.log(`Cut`)},{label:`Copy`,icon:l,onClick:()=>console.log(`Copy`)},{label:`Paste`,icon:u,onClick:()=>console.log(`Paste`)},{type:`divider`},{label:`Delete`,icon:m,onClick:()=>console.log(`Delete`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for actions`})})},b={render:()=>(0,g.jsx)(a,{items:[{type:`section`,title:`Edit`,items:[{label:`Cut`,icon:s,onClick:()=>console.log(`Cut`)},{label:`Copy`,icon:l,onClick:()=>console.log(`Copy`)},{label:`Paste`,icon:u,onClick:()=>console.log(`Paste`)}]},{type:`section`,title:`Share`,items:[{label:`Share`,icon:p,onClick:()=>console.log(`Share`)},{label:`Download`,icon:d,onClick:()=>console.log(`Download`)}]}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for grouped actions`})})},x={render:()=>(0,g.jsx)(a,{items:[{label:`Edit`,onClick:()=>console.log(`Edit`)},{label:`Duplicate`,onClick:()=>console.log(`Duplicate`)},{type:`divider`},{label:`Delete`,onClick:()=>console.log(`Delete`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click this area`})})},S={render:()=>(0,g.jsx)(a,{items:[{label:`Edit`,icon:c,onClick:()=>console.log(`Edit`)},{label:`Duplicate`,icon:f,onClick:()=>console.log(`Duplicate`)},{label:`Delete (no permission)`,icon:m,isDisabled:!0}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click this area`})})},C={render:()=>(0,g.jsx)(a,{menuWidth:280,items:[{label:`This is a longer option that needs more space`,onClick:()=>console.log(`Option 1`)},{label:`Another long option`,onClick:()=>console.log(`Option 2`)},{label:`Short`,onClick:()=>console.log(`Option 3`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for wide menu`})})},w={render:()=>(0,g.jsx)(a,{size:`sm`,items:[{label:`Cut`,onClick:()=>console.log(`Cut`)},{label:`Copy`,onClick:()=>console.log(`Copy`)},{label:`Paste`,onClick:()=>console.log(`Paste`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for compact menu`})})},T={render:()=>(0,g.jsx)(a,{isDisabled:!0,items:[{label:`Cut`,onClick:()=>console.log(`Cut`)},{label:`Copy`,onClick:()=>console.log(`Copy`)}],children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click shows native menu (disabled)`})})},E={render:()=>(0,g.jsx)(a,{menuContent:(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(i,{icon:c,label:`Edit`,onClick:()=>console.log(`Edit`)}),(0,g.jsx)(i,{icon:f,label:`Duplicate`,onClick:()=>console.log(`Duplicate`)}),(0,g.jsx)(n,{}),(0,g.jsx)(i,{icon:m,label:`Delete`,onClick:()=>console.log(`Delete`)})]}),children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for compound menu`})})},D={render:()=>(0,g.jsx)(a,{menuWidth:280,menuContent:(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(i,{icon:c,label:`Edit`,description:`Modify this item`,onClick:()=>console.log(`Edit`)}),(0,g.jsx)(i,{icon:p,label:`Share`,description:`Share with others`,onClick:()=>console.log(`Share`)}),(0,g.jsx)(n,{}),(0,g.jsx)(i,{icon:m,label:`Delete`,description:`Permanently remove`,onClick:()=>console.log(`Delete`)})]}),children:(0,g.jsx)(`div`,{className:`x1o8uwn5 xdh2fpr xbsl7fq x1y0avi5 xur7f20 x2b8uid x93p4j0 x87ps6o`,children:`Right-click for detailed menu`})})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Cut',
    onClick: () => console.log('Cut')
  }, {
    label: 'Copy',
    onClick: () => console.log('Copy')
  }, {
    label: 'Paste',
    onClick: () => console.log('Paste')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>Right-click this area</div>
    </ContextMenu>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Cut',
    icon: ScissorsIcon,
    onClick: () => console.log('Cut')
  }, {
    label: 'Copy',
    icon: ClipboardDocumentIcon,
    onClick: () => console.log('Copy')
  }, {
    label: 'Paste',
    icon: ClipboardIcon,
    onClick: () => console.log('Paste')
  }, {
    type: 'divider'
  }, {
    label: 'Delete',
    icon: TrashIcon,
    onClick: () => console.log('Delete')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>Right-click for actions</div>
    </ContextMenu>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    type: 'section',
    title: 'Edit',
    items: [{
      label: 'Cut',
      icon: ScissorsIcon,
      onClick: () => console.log('Cut')
    }, {
      label: 'Copy',
      icon: ClipboardDocumentIcon,
      onClick: () => console.log('Copy')
    }, {
      label: 'Paste',
      icon: ClipboardIcon,
      onClick: () => console.log('Paste')
    }]
  }, {
    type: 'section',
    title: 'Share',
    items: [{
      label: 'Share',
      icon: ShareIcon,
      onClick: () => console.log('Share')
    }, {
      label: 'Download',
      icon: ArrowDownTrayIcon,
      onClick: () => console.log('Download')
    }]
  }]}>
      <div {...stylex.props(triggerStyles.area)}>
        Right-click for grouped actions
      </div>
    </ContextMenu>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Edit',
    onClick: () => console.log('Edit')
  }, {
    label: 'Duplicate',
    onClick: () => console.log('Duplicate')
  }, {
    type: 'divider'
  }, {
    label: 'Delete',
    onClick: () => console.log('Delete')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>Right-click this area</div>
    </ContextMenu>
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Edit',
    icon: PencilIcon,
    onClick: () => console.log('Edit')
  }, {
    label: 'Duplicate',
    icon: DocumentDuplicateIcon,
    onClick: () => console.log('Duplicate')
  }, {
    label: 'Delete (no permission)',
    icon: TrashIcon,
    isDisabled: true
  }]}>
      <div {...stylex.props(triggerStyles.area)}>Right-click this area</div>
    </ContextMenu>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu menuWidth={280} items={[{
    label: 'This is a longer option that needs more space',
    onClick: () => console.log('Option 1')
  }, {
    label: 'Another long option',
    onClick: () => console.log('Option 2')
  }, {
    label: 'Short',
    onClick: () => console.log('Option 3')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>Right-click for wide menu</div>
    </ContextMenu>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu size="sm" items={[{
    label: 'Cut',
    onClick: () => console.log('Cut')
  }, {
    label: 'Copy',
    onClick: () => console.log('Copy')
  }, {
    label: 'Paste',
    onClick: () => console.log('Paste')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>
        Right-click for compact menu
      </div>
    </ContextMenu>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu isDisabled items={[{
    label: 'Cut',
    onClick: () => console.log('Cut')
  }, {
    label: 'Copy',
    onClick: () => console.log('Copy')
  }]}>
      <div {...stylex.props(triggerStyles.area)}>
        Right-click shows native menu (disabled)
      </div>
    </ContextMenu>
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu menuContent={<>
          <ContextMenuItem icon={PencilIcon} label="Edit" onClick={() => console.log('Edit')} />
          <ContextMenuItem icon={DocumentDuplicateIcon} label="Duplicate" onClick={() => console.log('Duplicate')} />
          <Divider />
          <ContextMenuItem icon={TrashIcon} label="Delete" onClick={() => console.log('Delete')} />
        </>}>
      <div {...stylex.props(triggerStyles.area)}>
        Right-click for compound menu
      </div>
    </ContextMenu>
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu menuWidth={280} menuContent={<>
          <ContextMenuItem icon={PencilIcon} label="Edit" description="Modify this item" onClick={() => console.log('Edit')} />
          <ContextMenuItem icon={ShareIcon} label="Share" description="Share with others" onClick={() => console.log('Share')} />
          <Divider />
          <ContextMenuItem icon={TrashIcon} label="Delete" description="Permanently remove" onClick={() => console.log('Delete')} />
        </>}>
      <div {...stylex.props(triggerStyles.area)}>
        Right-click for detailed menu
      </div>
    </ContextMenu>
}`,...D.parameters?.docs?.source}}},O=[`Default`,`WithIcons`,`WithSections`,`WithDividers`,`WithDisabledItems`,`CustomWidth`,`SmallSize`,`Disabled`,`CompoundBasic`,`CompoundWithDescriptions`]}))();export{E as CompoundBasic,D as CompoundWithDescriptions,C as CustomWidth,v as Default,T as Disabled,w as SmallSize,S as WithDisabledItems,x as WithDividers,y as WithIcons,b as WithSections,O as __namedExportsOrder,_ as default};