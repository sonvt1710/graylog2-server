### Uncontrolled

```js
import { Tab } from 'components/bootstrap';

<Tabs defaultActiveKey={2} id="uncontrolled-tab-example">
  <Tab eventKey={1} title="Tab 1">
    Tab 1 content
  </Tab>
  <Tab eventKey={2} title="Tab 2">
    Tab 2 content
  </Tab>
  <Tab eventKey={3} title="Tab 3" disabled>
    Tab 3 content
  </Tab>
</Tabs>;
```

### Controlled

```js
import { Tab } from 'components/bootstrap';

const TabExample = () => {
  const [activeTab, setActiveTab] = React.useState(1);

  const handleSetActive = (key) => {
    alert(`Switching to Tab ${key}`);
    setActiveTab(key);
  };

  return (
    <Tabs activeKey={activeTab} onSelect={handleSetActive} id="controlled-tab-example">
      <Tab eventKey={1} title="Tab 1">
        Tab 1 content
      </Tab>
      <Tab eventKey={2} title="Tab 2">
        Tab 2 content
      </Tab>
      <Tab eventKey={3} title="Tab 3">
        Tab 3 content
      </Tab>
    </Tabs>
  );
};

<TabExample />;
```

### Tabs with Dropdown

```js
import { Row, Col, Nav, NavItem, NavDropdown, MenuItem, Tab } from 'components/bootstrap';

<Tab.Container defaultActiveKey="first" id="drodown-tab-example">
  <Row className="clearfix">
    <Col sm={12}>
      <Nav bsStyle="tabs">
        <NavItem eventKey="first">Tab 1</NavItem>
        <NavItem eventKey="second">Tab 2</NavItem>
        <NavDropdown eventKey="3" title="Dropdown">
          <MenuItem eventKey="3.1">Action</MenuItem>
          <MenuItem eventKey="3.2">Another action</MenuItem>
          <MenuItem eventKey="3.3">Something else here</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey="3.4">Separated link</MenuItem>
        </NavDropdown>
      </Nav>
    </Col>
    <Col sm={12}>
      <Tab.Content animation>
        <Tab.Pane eventKey="first">Tab 1 content</Tab.Pane>
        <Tab.Pane eventKey="second">Tab 2 content</Tab.Pane>
        <Tab.Pane eventKey="3.1">Tab 3.1 content</Tab.Pane>
        <Tab.Pane eventKey="3.2">Tab 3.2 content</Tab.Pane>
        <Tab.Pane eventKey="3.3">Tab 3.3 content</Tab.Pane>
        <Tab.Pane eventKey="3.4">Tab 3.4 content</Tab.Pane>
      </Tab.Content>
    </Col>
  </Row>
</Tab.Container>;
```
