import{i as e,s as t}from"./preload-helper-CT_b8DTk.js";import{t as n}from"./react-B7Te67-h.js";import{t as r}from"./jsx-runtime-DqZldVDK.js";import{t as i}from"./Text-Bt7jq58k.js";import{n as a,t as o}from"./Badge-x089lqwb.js";import{t as s}from"./Heading-DaPZub_W.js";import{t as c}from"./Text-BYms8e3u.js";import{d as l,g as u,gr as d,h as f,hr as p,p as m}from"./iframe-CI1vGjgx.js";function h(e){return typeof e==`string`||typeof e==`number`?String(e):Array.isArray(e)?e.map(h).join(``):``}function g(e){return e.trim().toLowerCase().replace(/['\u201C\u201D"]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`section`}var _,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{_=t(n()),l(),o(),p(),c(),v=r(),y={title:`Core/Outline`,component:u,tags:[`autodocs`],argTypes:{label:{control:`text`,description:`Accessible label for the nav landmark`},activeId:{control:`text`,description:`Controlled active item id`},density:{control:`radio`,options:[`default`,`compact`],description:`Density variant`}}},b=[{id:`overview`,label:`Overview`,level:2},{id:`installation`,label:`Installation`,level:2},{id:`theming`,label:`Theming`,level:2},{id:`tokens`,label:`Tokens`,level:3},{id:`component-overrides`,label:`Component overrides`,level:3},{id:`accessibility`,label:`Accessibility`,level:2}],x=[`## Overview`,``,`Astryx gives teams a consistent foundation for internal product surfaces.`,``,`## Installation`,``,`Install the package and wrap the app in an Theme provider.`,``,`### Package setup`,``,`Import components from their component subpaths for clear ownership.`,``,`### Theme setup`,``,`Use a built theme in production so component overrides are present at first paint.`,``,`## Accessibility`,``,`Components include semantic roles, labels, and focus behavior where applicable.`].join(`
`),S={args:{items:b}},C={args:{items:b,activeId:`tokens`}},w={args:{items:b,activeId:`installation`,density:`compact`}},T={render:()=>(0,v.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`minmax(0, 1fr) 220px`,gap:32,maxWidth:960},children:[(0,v.jsxs)(`article`,{style:{display:`grid`,gap:24},children:[(0,v.jsxs)(`section`,{children:[(0,v.jsx)(`h2`,{id:`overview`,children:`Overview`}),(0,v.jsx)(`p`,{children:`Astryx components provide consistent interaction, styling, and theme behavior for internal tools.`})]}),(0,v.jsxs)(`section`,{children:[(0,v.jsx)(`h2`,{id:`installation`,children:`Installation`}),(0,v.jsx)(`p`,{children:`Install the package, wrap the app with Theme, and import components from their subpaths.`})]}),(0,v.jsxs)(`section`,{children:[(0,v.jsx)(`h2`,{id:`theming`,children:`Theming`}),(0,v.jsx)(`p`,{children:`Themes define semantic tokens and component overrides without changing app code.`}),(0,v.jsx)(`h3`,{id:`tokens`,children:`Tokens`}),(0,v.jsx)(`p`,{children:`Use semantic color, spacing, typography, radius, elevation, and motion tokens.`}),(0,v.jsx)(`h3`,{id:`component-overrides`,children:`Component overrides`}),(0,v.jsx)(`p`,{children:`Component overrides target the stable Astryx selector surface emitted by each component: astryx-* classes plus data-* prop reflections.`})]}),(0,v.jsxs)(`section`,{children:[(0,v.jsx)(`h2`,{id:`accessibility`,children:`Accessibility`}),(0,v.jsx)(`p`,{children:`Components include landmark, keyboard, focus, and ARIA behavior where applicable.`})]})]}),(0,v.jsx)(`aside`,{style:{position:`sticky`,top:24,alignSelf:`start`},children:(0,v.jsx)(u,{items:b})})]})},E={render:()=>{let e=f(x);return(0,v.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`minmax(0, 1fr) 220px`,gap:32,maxWidth:960},children:[(0,v.jsx)(d,{components:{heading:({level:e,children:t})=>(0,v.jsx)(`h${e}`,{id:g(h(t)),children:t})},children:x}),(0,v.jsx)(`aside`,{style:{position:`sticky`,top:24,alignSelf:`start`},children:(0,v.jsx)(u,{items:e})})]})}},D={render:()=>{let e=(0,_.useRef)(null),t=m(e);return(0,v.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`minmax(0, 1fr) 220px`,gap:32,maxWidth:960},children:[(0,v.jsxs)(`article`,{ref:e,style:{display:`grid`,gap:24},children:[(0,v.jsxs)(`section`,{children:[(0,v.jsx)(s,{id:`account-settings`,level:2,children:`Account settings`}),(0,v.jsx)(i,{type:`body`,children:`Manage profile, authentication, and workspace preferences.`}),(0,v.jsxs)(`div`,{style:{display:`flex`,gap:8,marginTop:12},children:[(0,v.jsx)(a,{variant:`success`,label:`Active`}),(0,v.jsx)(a,{variant:`neutral`,label:`Workspace`})]})]}),(0,v.jsxs)(`section`,{children:[(0,v.jsx)(s,{id:`notifications`,level:2,children:`Notifications`}),(0,v.jsx)(i,{type:`body`,children:`Choose which product events should notify the team.`}),(0,v.jsx)(s,{id:`email-alerts`,level:3,children:`Email alerts`}),(0,v.jsx)(i,{type:`body`,children:`Use email for low-frequency summaries and approvals.`}),(0,v.jsx)(s,{id:`push-alerts`,level:3,children:`Push alerts`}),(0,v.jsx)(i,{type:`body`,children:`Use push for time-sensitive updates and incidents.`})]}),(0,v.jsxs)(`section`,{children:[(0,v.jsx)(s,{id:`billing`,level:2,children:`Billing`}),(0,v.jsx)(i,{type:`body`,children:`Review invoices, payment methods, and usage limits.`})]})]}),(0,v.jsx)(`aside`,{style:{position:`sticky`,top:24,alignSelf:`start`},children:(0,v.jsx)(u,{items:t})})]})}},O={render:()=>(0,v.jsx)(`div`,{style:{width:240},children:(0,v.jsx)(u,{items:[{id:`chapter-1`,label:`Chapter 1`,level:1},{id:`section-1-1`,label:`Section 1.1`,level:2},{id:`subsection-1-1-1`,label:`Subsection 1.1.1`,level:3},{id:`subsection-1-1-2`,label:`Subsection 1.1.2`,level:3},{id:`section-1-2`,label:`Section 1.2`,level:2},{id:`chapter-2`,label:`Chapter 2`,level:1},{id:`section-2-1`,label:`Section 2.1`,level:2}],activeId:`subsection-1-1-1`})})},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    items: outlineItems
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    items: outlineItems,
    activeId: 'tokens'
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    items: outlineItems,
    activeId: 'installation',
    density: 'compact'
  }
}`,...w.parameters?.docs?.source},description:{story:`Compact density variant — reduced spacing for dense UIs`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 220px',
    gap: 32,
    maxWidth: 960
  }}>
      <article style={{
      display: 'grid',
      gap: 24
    }}>
        <section>
          <h2 id="overview">Overview</h2>
          <p>
            Astryx components provide consistent interaction, styling, and theme
            behavior for internal tools.
          </p>
        </section>
        <section>
          <h2 id="installation">Installation</h2>
          <p>
            Install the package, wrap the app with Theme, and import
            components from their subpaths.
          </p>
        </section>
        <section>
          <h2 id="theming">Theming</h2>
          <p>
            Themes define semantic tokens and component overrides without
            changing app code.
          </p>
          <h3 id="tokens">Tokens</h3>
          <p>
            Use semantic color, spacing, typography, radius, elevation, and
            motion tokens.
          </p>
          <h3 id="component-overrides">Component overrides</h3>
          <p>
            Component overrides target the stable Astryx selector surface emitted
            by each component: astryx-* classes plus data-* prop reflections.
          </p>
        </section>
        <section>
          <h2 id="accessibility">Accessibility</h2>
          <p>
            Components include landmark, keyboard, focus, and ARIA behavior
            where applicable.
          </p>
        </section>
      </article>
      <aside style={{
      position: 'sticky',
      top: 24,
      alignSelf: 'start'
    }}>
        <Outline items={outlineItems} />
      </aside>
    </div>
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => {
    const items = useOutlineFromMarkdown(markdownContent);
    return <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 220px',
      gap: 32,
      maxWidth: 960
    }}>
        <Markdown components={{
        heading: ({
          level,
          children
        }) => {
          const Tag = \`h\${level}\` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
          return <Tag id={storySlug(nodeText(children))}>{children}</Tag>;
        }
      }}>
          {markdownContent}
        </Markdown>
        <aside style={{
        position: 'sticky',
        top: 24,
        alignSelf: 'start'
      }}>
          <Outline items={items} />
        </aside>
      </div>;
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => {
    const contentRef = useRef<HTMLElement | null>(null);
    const items = useOutlineFromDOM(contentRef);
    return <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 220px',
      gap: 32,
      maxWidth: 960
    }}>
        <article ref={contentRef} style={{
        display: 'grid',
        gap: 24
      }}>
          <section>
            <Heading id="account-settings" level={2}>
              Account settings
            </Heading>
            <Text type="body">
              Manage profile, authentication, and workspace preferences.
            </Text>
            <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 12
          }}>
              <Badge variant="success" label="Active" />
              <Badge variant="neutral" label="Workspace" />
            </div>
          </section>
          <section>
            <Heading id="notifications" level={2}>
              Notifications
            </Heading>
            <Text type="body">
              Choose which product events should notify the team.
            </Text>
            <Heading id="email-alerts" level={3}>
              Email alerts
            </Heading>
            <Text type="body">
              Use email for low-frequency summaries and approvals.
            </Text>
            <Heading id="push-alerts" level={3}>
              Push alerts
            </Heading>
            <Text type="body">
              Use push for time-sensitive updates and incidents.
            </Text>
          </section>
          <section>
            <Heading id="billing" level={2}>
              Billing
            </Heading>
            <Text type="body">
              Review invoices, payment methods, and usage limits.
            </Text>
          </section>
        </article>
        <aside style={{
        position: 'sticky',
        top: 24,
        alignSelf: 'start'
      }}>
          <Outline items={items} />
        </aside>
      </div>;
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: () => {
    const items: OutlineItem[] = [{
      id: 'chapter-1',
      label: 'Chapter 1',
      level: 1
    }, {
      id: 'section-1-1',
      label: 'Section 1.1',
      level: 2
    }, {
      id: 'subsection-1-1-1',
      label: 'Subsection 1.1.1',
      level: 3
    }, {
      id: 'subsection-1-1-2',
      label: 'Subsection 1.1.2',
      level: 3
    }, {
      id: 'section-1-2',
      label: 'Section 1.2',
      level: 2
    }, {
      id: 'chapter-2',
      label: 'Chapter 2',
      level: 1
    }, {
      id: 'section-2-1',
      label: 'Section 2.1',
      level: 2
    }];
    return <div style={{
      width: 240
    }}>
        <Outline items={items} activeId="subsection-1-1-1" />
      </div>;
  }
}`,...O.parameters?.docs?.source},description:{story:`Deep nesting with multiple indent levels`,...O.parameters?.docs?.description}}},k=[`Basic`,`Controlled`,`Compact`,`WithDocument`,`ExtractFromMarkdown`,`ExtractFromHTML`,`DeepNesting`]}))();export{S as Basic,w as Compact,C as Controlled,O as DeepNesting,D as ExtractFromHTML,E as ExtractFromMarkdown,T as WithDocument,k as __namedExportsOrder,y as default};