import React, { createContext, useState, FormEvent } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';

type ActionType = 'setIdolName' | 'setIdolType';
type IdolType = 'All' | 'Princess' | 'Fairy' | 'Angel';

interface Action {
  type: ActionType;
  message: string;
}

interface ApplicationStore {
  idolName: string;
  idolType: IdolType;
  dispatch: (action: Action) => void;
}

const StateContext = createContext<ApplicationStore>({} as ApplicationStore);

const useStore = () => {
  const [idolName, setIdolName] = useState('');
  const [idolType, setIdolType] = useState<IdolType>('All');

  const dispatch = (action: Action) => {
    switch (action.type) {
      case 'setIdolName':
        setIdolName(action.message);
        break;
      case 'setIdolType':
        setIdolType(action.message as IdolType);
        break;
      default:
        break;
    }
  };

  return { idolName, idolType, dispatch };
};

const App: React.FC = () => {
  const context = useStore();
  const { idolName, idolType } = context;

  return (
    <StateContext.Provider value={context}>
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
                <Form.Control
                  type="text"
                  placeholder="名前の一部(かな文字もOK)"
                  value={idolName}
                  onChange={(e: FormEvent<any>) =>
                    context.dispatch({
                      type: 'setIdolName',
                      message: e.currentTarget.value,
                    } as Action)
                  }
                />
              </Form.Group>
              <Form.Group controlId="idolType">
                <Form.Label>アイドルの属性</Form.Label>
                <Form.Control
                  as="select"
                  value={idolType}
                  onChange={(e: FormEvent<any>) =>
                    context.dispatch({
                      type: 'setIdolType',
                      message: e.currentTarget.value,
                    } as Action)
                  }
                >
                  <option>All</option>
                  <option>Princess</option>
                  <option>Fairy</option>
                  <option>Angel</option>
                </Form.Control>
              </Form.Group>
              <Button
                className="w-100"
                onClick={() =>
                  alert(`name=${context.idolName}\ntype=${context.idolType}`)
                }
              >
                テスト
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </StateContext.Provider>
  );
};

export default App;
