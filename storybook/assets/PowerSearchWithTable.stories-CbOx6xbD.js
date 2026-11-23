import{i as e,s as t}from"./preload-helper-CT_b8DTk.js";import{t as n}from"./react-B7Te67-h.js";import{t as r}from"./jsx-runtime-DqZldVDK.js";import{_ as i,g as a,t as o}from"./Table-BT5ToMQd.js";import{Q as s,Y as c,Z as l,dt as u}from"./iframe-CI1vGjgx.js";var d,f,p,m,h,g,_,v,y,b;e((()=>{d=t(n()),c(),u(),f=r(),p=[{value:`fiction`,label:`Fiction`},{value:`non-fiction`,label:`Non-Fiction`},{value:`sci-fi`,label:`Science Fiction`},{value:`fantasy`,label:`Fantasy`},{value:`mystery`,label:`Mystery`},{value:`romance`,label:`Romance`},{value:`biography`,label:`Biography`},{value:`history`,label:`History`}],m=[{key:`title`,type:`string`,label:`Title`},{key:`author`,type:`string`,label:`Author`},{key:`year`,type:`number`,label:`Publication Year`},{key:`genre`,type:`enum`,label:`Genre`,enumValues:p}],h=[{id:`1`,title:`Dune`,author:`Frank Herbert`,year:1965,genre:`sci-fi`},{id:`2`,title:`Pride and Prejudice`,author:`Jane Austen`,year:1813,genre:`romance`},{id:`3`,title:`The Great Gatsby`,author:`F. Scott Fitzgerald`,year:1925,genre:`fiction`},{id:`4`,title:`1984`,author:`George Orwell`,year:1949,genre:`sci-fi`},{id:`5`,title:`To Kill a Mockingbird`,author:`Harper Lee`,year:1960,genre:`fiction`},{id:`6`,title:`The Hobbit`,author:`J.R.R. Tolkien`,year:1937,genre:`fantasy`},{id:`7`,title:`Sapiens`,author:`Yuval Noah Harari`,year:2011,genre:`non-fiction`},{id:`8`,title:`The Name of the Wind`,author:`Patrick Rothfuss`,year:2007,genre:`fantasy`},{id:`9`,title:`Gone Girl`,author:`Gillian Flynn`,year:2012,genre:`mystery`},{id:`10`,title:`Steve Jobs`,author:`Walter Isaacson`,year:2011,genre:`biography`},{id:`11`,title:`A Brief History of Time`,author:`Stephen Hawking`,year:1988,genre:`non-fiction`},{id:`12`,title:`The Shining`,author:`Stephen King`,year:1977,genre:`mystery`},{id:`13`,title:`The Handmaid's Tale`,author:`Margaret Atwood`,year:1985,genre:`sci-fi`},{id:`14`,title:`Outlander`,author:`Diana Gabaldon`,year:1991,genre:`romance`},{id:`15`,title:`The Guns of August`,author:`Barbara Tuchman`,year:1962,genre:`history`}],g=[{key:`title`,header:`Title`,width:i(2)},{key:`author`,header:`Author`,width:i(2)},{key:`year`,header:`Year`,width:a(100)},{key:`genre`,header:`Genre`,width:a(140),renderCell:e=>p.find(t=>t.value===e.genre)?.label??e.genre}],_={title:`Core/PowerSearchWithTable`,tags:[`autodocs`],decorators:[e=>(0,f.jsx)(`div`,{style:{width:800},children:(0,f.jsx)(e,{})})]},v={render:()=>{let[e,t]=(0,d.useState)([]),{config:n,applyFilters:r}=l(m,`Books`),i=r(e,h);return(0,f.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:16},children:[(0,f.jsx)(s,{config:n,filters:e,onChange:e=>t([...e]),placeholder:`Filter books by title, author, year, genre...`,resultCount:i.length}),(0,f.jsx)(o,{data:i,columns:g,idKey:`id`,hasHover:!0})]})}},y={render:()=>{let[e,t]=(0,d.useState)([{field:`genre`,operator:`is`,value:{type:`enum`,value:`sci-fi`}}]),{config:n,applyFilters:r}=l(m,`Books`),i=r(e,h);return(0,f.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:16},children:[(0,f.jsx)(s,{config:n,filters:e,onChange:e=>t([...e]),placeholder:`Filter books...`,resultCount:i.length}),(0,f.jsx)(o,{data:i,columns:g,idKey:`id`,hasHover:!0,isStriped:!0})]})}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [filters, setFilters] = useState<PowerSearchFilter[]>([]);
    const {
      config,
      applyFilters
    } = usePowerSearchConfig(fieldDefs, 'Books');
    const filteredBooks = applyFilters(filters, books);
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
        <PowerSearch config={config} filters={filters} onChange={newFilters => setFilters([...newFilters])} placeholder="Filter books by title, author, year, genre..." resultCount={filteredBooks.length} />
        <Table data={filteredBooks} columns={columns} idKey="id" hasHover />
      </div>;
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [filters, setFilters] = useState<PowerSearchFilter[]>([{
      field: 'genre',
      operator: 'is',
      value: {
        type: 'enum',
        value: 'sci-fi'
      }
    }]);
    const {
      config,
      applyFilters
    } = usePowerSearchConfig(fieldDefs, 'Books');
    const filteredBooks = applyFilters(filters, books);
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
        <PowerSearch config={config} filters={filters} onChange={newFilters => setFilters([...newFilters])} placeholder="Filter books..." resultCount={filteredBooks.length} />
        <Table data={filteredBooks} columns={columns} idKey="id" hasHover isStriped />
      </div>;
  }
}`,...y.parameters?.docs?.source}}},b=[`Default`,`WithPresetFilters`]}))();export{v as Default,y as WithPresetFilters,b as __namedExportsOrder,_ as default};