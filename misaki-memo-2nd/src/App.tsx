import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';

const App: React.FC = () => (
  <Container>
    <Row>
      <Col className="m-3">
        <h1 className="text-center">美咲メモ 2nd</h1>
      </Col>
    </Row>
    <Row>
      <Col xs={12} md={6} className="my-3 mx-auto">
        <Form className="border p-3">
          <Form.Group controlId="idolName">
            <Form.Label>アイドルの名前</Form.Label>
            <Form.Control type="text" placeholder="名前の一部(かな文字もOK)" />
          </Form.Group>
          <Form.Group controlId="idolType">
            <Form.Label>アイドルの属性</Form.Label>
            <Form.Control as="select">
              <option className="test">Princess</option>
              <option>Fairy</option>
              <option>Angel</option>
            </Form.Control>
          </Form.Group>
          <Button className="w-100">テスト</Button>
        </Form>
      </Col>
    </Row>
  </Container>
);

export default App;
