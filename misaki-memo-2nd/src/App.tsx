import React, {
  createContext,
  useState,
  FormEvent,
  useContext,
  useEffect,
} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, ListGroup } from 'react-bootstrap';

// Actionの種類
type ActionType = 'setIdolName' | 'setIdolType' | 'setMissionName';

// アイドルの属性の種類
type IdolType = 'All' | 'Princess' | 'Fairy' | 'Angel';
const IDOL_TYPE_LIST = ['All', 'Princess', 'Fairy', 'Angel'];

// ミッションの内容
const MISSION_TEXT_LIST = [
  'アイドルを覚醒させる',
  'ユニットライブの成功',
  'ソロライブ成功させる',
  '親愛度を50以上増やす',
  'メモリアルコミュ閲覧',
  '13人ライブ MVを見る',
  'ギフトプレゼントする',
  '(指定曲)をクリアする',
  'メールかブログを見る',
  'ドレスアップで着替え'
];

const MISSION_TEXT_LIST2 = ['(未指定)', ...MISSION_TEXT_LIST];

const MISSION_TEXT_TO_INDEX: {[key: string]: number} = {
  'アイドルを覚醒させる': 0,
  'ユニットライブの成功': 1,
  'ソロライブ成功させる': 2,
  '親愛度を50以上増やす': 3,
  'メモリアルコミュ閲覧': 4,
  '13人ライブ MVを見る': 5,
  'ギフトプレゼントする': 6,
  '(指定曲)をクリアする': 7,
  'メールかブログを見る': 8,
  'ドレスアップで着替え': 9
};

// Actionを表現するインターフェース
interface Action {
  type: ActionType;
  message: string;
}

// ミッション状況を表現するためのインターフェース
interface IdolState {
  idol: IdolData;
  missionFlg: boolean[];
}

// アプリケーションの状態を保存するためのインターフェース
interface ApplicationStore {
  idolName: string;
  idolType: IdolType;
  missionName: string;
  filteredIdolStateList: IdolState[];
  dispatch: (action: Action) => void;
}

// Context
const StateContext = createContext<ApplicationStore>({} as ApplicationStore);

// アイドルの情報
interface IdolData {
  id: number;
  name: string;
  ruby: string;
  type: IdolType;
  music: string;
  color: string;
}

// ApplicationStore型の値を返す関数
const useStore = () => {
  // アイドルの名前
  const [idolName, setIdolName] = useState('');
  // アイドルの属性
  const [idolType, setIdolType] = useState<IdolType>('All');
  // ミッションのインデックス
  const [missionName, setMissionName] = useState(MISSION_TEXT_LIST2[0]);
  // アイドルのデータ一覧
  const [idolStateList, setIdolStateList] = useState<IdolState[]>([]);
  // 表示するアイドルの一覧
  const [filteredIdolStateList, setFilteredIdolStateList] = useState<IdolState[]>([]);

  // 状態の初期化
  useEffect(() => {
    fetch('./idol_list.json').then((res: Response) => {
      res.json().then((dataList: IdolData[]) => {
        setIdolStateList(dataList.map((data: IdolData) => {
          return {
            'idol': data, 'missionFlg': [
              false, false, false, false, false, false, false, false, false, false
            ]
          } as IdolState;
        }));
      });
    });
  }, []);

  // 表示するアイドルの一覧を更新
  useEffect(() => {
    if (idolType === 'All') {
      setFilteredIdolStateList(
        idolStateList.filter(record =>
          `${record.idol.name}/${record.idol.ruby}`.includes(idolName),
        ),
      );
    } else {
      setFilteredIdolStateList(
        idolStateList.filter(
          record =>
            `${record.idol.name}/${record.idol.ruby}`.includes(idolName) &&
            record.idol.type === idolType,
        ),
      );
    }
  }, [idolName, idolType, idolStateList]);

  // Reduxのdispatchに相当する
  const dispatch = (action: Action) => {
    switch (action.type) {
      case 'setIdolName':
        setIdolName(action.message);
        break;
      case 'setIdolType':
        setIdolType(action.message as IdolType);
        break;
      case 'setMissionName':
        setMissionName(action.message);
        break;
      default:
        break;
    }
  };

  return { idolName, idolType, missionName, filteredIdolStateList, dispatch };
};

// 検索フォームのComponent
const SearchForm: React.FC = () => {
  const { idolName, idolType, missionName, dispatch } = useContext(StateContext);

  const onChangeIdolName = (e: FormEvent<any>) =>
    dispatch({
      type: 'setIdolName',
      message: e.currentTarget.value,
    } as Action);

  const onChangeIdolType = (e: FormEvent<any>) =>
    dispatch({
      type: 'setIdolType',
      message: e.currentTarget.value,
    } as Action);

  const onChangeMissionName = (e: FormEvent<any>) =>
    dispatch({
      type: 'setMissionName',
      message: e.currentTarget.value,
  } as Action);

  return (
    <Form className="border p-3">
      <Form.Group controlId="idolName">
        <Form.Label>アイドルの名前</Form.Label>
        <Form.Control
          type="text"
          placeholder="名前の一部(かな文字もOK)"
          value={idolName}
          onChange={onChangeIdolName}
        />
      </Form.Group>
      <Form.Group controlId="idolType">
        <Form.Label>アイドルの属性</Form.Label>
        <Form.Control as="select" value={idolType} onChange={onChangeIdolType}>
          {IDOL_TYPE_LIST.map((name: string) => (
            <option key={name}>{name}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group controlId="idolType">
        <Form.Label>ミッションの種類</Form.Label>
        <Form.Control as="select" value={missionName} onChange={onChangeMissionName}>
          {MISSION_TEXT_LIST2.map((name: string) => (
            <option key={name}>{name}</option>
          ))}
        </Form.Control>
      </Form.Group>
    </Form>
  );
};

// アイドル一覧のComponent
const IdolView: React.FC = () => {
  const { missionName, filteredIdolStateList } = useContext(StateContext);

  if (filteredIdolStateList.length > 0) {
    return (
      <ListGroup>
        {filteredIdolStateList.map((idolState: IdolState) => {
          const missionCount = idolState.missionFlg.filter(flg => flg).length;
          return (
            <ListGroup.Item key={idolState.idol.id}>
              <div className="d-flex">
                <div
                  className="border border-dark mr-1 mt-1"
                  style={{
                    backgroundColor: idolState.idol.color,
                    width: 20,
                    height: 20,
                  }}
                />
                <span className="font-weight-bold">{idolState.idol.name}</span>
                {
                  missionName in MISSION_TEXT_TO_INDEX
                  ? (<span>　ミッション＝{idolState.missionFlg[MISSION_TEXT_TO_INDEX[missionName]] ? '達成' : '未達成'}</span>)
                  : (<span>　ミッション達成数＝{missionCount}</span>)
                }
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    );
  }

  return (
    <ListGroup>
      <ListGroup.Item>※該当者がいませんでした</ListGroup.Item>
    </ListGroup>
  );
};

// メインとなるComponent
const App: React.FC = () => {
  const context = useStore();

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
            <SearchForm />
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6} className="my-3 mx-auto">
            <IdolView />
          </Col>
        </Row>
      </Container>
    </StateContext.Provider>
  );
};

export default App;
