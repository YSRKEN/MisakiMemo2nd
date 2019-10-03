import React, {
  createContext,
  useState,
  FormEvent,
  useContext,
  useEffect,
} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, ListGroup, Button } from 'react-bootstrap';

// Actionの種類
type ActionType =
  | 'setIdolName'
  | 'setIdolType'
  | 'setMissionName'
  | 'changeMissionState'
  | 'setSortType';

// アイドルの属性の種類
type IdolType = 'All' | 'Princess' | 'Fairy' | 'Angel';
const IDOL_TYPE_LIST = ['All', 'Princess', 'Fairy', 'Angel'];

// ソート順の種類(アイドルID順・ミッションの未達成順・ミッションの達成順)
type SortType = 'IdolId' | 'MissionAsc' | 'MissionDesc';
const SORT_TYPE_LIST = ['IdolId', 'MissionAsc', 'MissionDesc'];
const SORT_TYPE_DICT: { [key: string]: string } = {
  IdolId: 'アイドルID順',
  MissionAsc: 'ミッションの未達成順',
  MissionDesc: 'ミッションの達成順',
};

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
  'ドレスアップで着替え',
];

const MISSION_TEXT_LIST2 = ['☆ミッション達成数', ...MISSION_TEXT_LIST];

const MISSION_TEXT_TO_INDEX: { [key: string]: number } = {
  アイドルを覚醒させる: 0,
  ユニットライブの成功: 1,
  ソロライブ成功させる: 2,
  親愛度を50以上増やす: 3,
  メモリアルコミュ閲覧: 4,
  '13人ライブ MVを見る': 5,
  ギフトプレゼントする: 6,
  '(指定曲)をクリアする': 7,
  メールかブログを見る: 8,
  ドレスアップで着替え: 9,
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
  sortType: SortType;
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
  // ソート順
  const [sortType, setSortType] = useState<SortType>('IdolId');
  // アイドルのデータ一覧
  const [idolStateList, setIdolStateList] = useState<IdolState[]>([]);
  // 表示するアイドルの一覧
  const [filteredIdolStateList, setFilteredIdolStateList] = useState<
    IdolState[]
  >([]);

  // 状態の初期化
  useEffect(() => {
    fetch('./idol_list.json').then((res: Response) => {
      res.json().then((dataList: IdolData[]) => {
        setIdolStateList(
          dataList.map((data: IdolData) => {
            return {
              idol: data,
              missionFlg: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
              ],
            } as IdolState;
          }),
        );
      });
    });
  }, []);

  // 表示するアイドルの一覧を更新
  useEffect(() => {
    let newIdolStateList: IdolState[] = [];
    if (idolType === 'All') {
      newIdolStateList = idolStateList.filter(record =>
        `${record.idol.name}/${record.idol.ruby}`.includes(idolName),
      );
    } else {
      newIdolStateList = idolStateList.filter(
        record =>
          `${record.idol.name}/${record.idol.ruby}`.includes(idolName) &&
          record.idol.type === idolType,
      );
    }
    switch (sortType) {
      case 'IdolId':
        newIdolStateList = newIdolStateList.sort(
          (a, b) => a.idol.id - b.idol.id,
        );
        break;
      case 'MissionAsc': {
        if (missionName === MISSION_TEXT_LIST2[0]) {
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg.filter(flg => flg).length;
            const bCount = b.missionFlg.filter(flg => flg).length;

            return aCount - bCount;
          });
        } else {
          const missionIndex = MISSION_TEXT_TO_INDEX[missionName];
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg[missionIndex] ? 1 : 0;
            const bCount = b.missionFlg[missionIndex] ? 1 : 0;

            return aCount - bCount;
          });
        }
        break;
      }
      case 'MissionDesc': {
        if (missionName === MISSION_TEXT_LIST2[0]) {
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg.filter(flg => flg).length;
            const bCount = b.missionFlg.filter(flg => flg).length;

            return bCount - aCount;
          });
        } else {
          const missionIndex = MISSION_TEXT_TO_INDEX[missionName];
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg[missionIndex] ? 1 : 0;
            const bCount = b.missionFlg[missionIndex] ? 1 : 0;

            return bCount - aCount;
          });
        }
        break;
      }
      default:
        break;
    }
    setFilteredIdolStateList(newIdolStateList);
  }, [idolName, idolType, sortType, idolStateList, missionName]);

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
      case 'changeMissionState': {
        const [selectedIdolName, selectedMissionName] = action.message.split(
          ',',
        );
        const idolIndex = idolStateList.findIndex(
          state => state.idol.name === selectedIdolName,
        );
        const missionIndex = MISSION_TEXT_TO_INDEX[selectedMissionName];
        const newIdolStateList = [...idolStateList];
        newIdolStateList[idolIndex].missionFlg[
          missionIndex
        ] = !newIdolStateList[idolIndex].missionFlg[missionIndex];
        setIdolStateList(newIdolStateList);
        break;
      }
      case 'setSortType':
        setSortType(action.message as SortType);
        break;
      default:
        break;
    }
  };

  return {
    idolName,
    idolType,
    missionName,
    sortType,
    filteredIdolStateList,
    dispatch,
  };
};

// 検索フォームのComponent
const SearchForm: React.FC = () => {
  const { idolName, idolType, missionName, sortType, dispatch } = useContext(
    StateContext,
  );

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

  const onChangeSortType = (e: FormEvent<any>) =>
    dispatch({
      type: 'setSortType',
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
      <Form.Group controlId="MissionType">
        <Form.Label>ミッションの種類</Form.Label>
        <Form.Control
          as="select"
          value={missionName}
          onChange={onChangeMissionName}
        >
          {MISSION_TEXT_LIST2.map((name: string) => (
            <option key={name}>{name}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group controlId="SortType">
        <Form.Label>ソート順</Form.Label>
        <Form.Control as="select" value={sortType} onChange={onChangeSortType}>
          {SORT_TYPE_LIST.map((name: string) => (
            <option key={name} value={name}>
              {SORT_TYPE_DICT[name]}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
    </Form>
  );
};

// アイドルのミッション進捗状況を表現するためのComponent
const IdolMissionStatus: React.FC<{ idolState: IdolState }> = ({
  idolState,
}) => {
  const { missionName, dispatch } = useContext(StateContext);

  const changeMissionState = () =>
    dispatch({
      type: 'changeMissionState',
      message: `${idolState.idol.name},${missionName}`,
    } as Action);

  const showMissionStatus = () => {
    let text1 = '【達成済み】\n';
    let text2 = '【未達成】\n';
    idolState.missionFlg.forEach((flg: boolean, index: number) => {
      if (flg) {
        if (MISSION_TEXT_LIST[index].includes('指定曲')) {
          text1 += `・${MISSION_TEXT_LIST[index].replace(
            '(指定曲)',
            idolState.idol.music,
          )}\n`;
        } else {
          text1 += `・${MISSION_TEXT_LIST[index]}\n`;
        }
      } else if (MISSION_TEXT_LIST[index].includes('指定曲')) {
        text2 += `・${MISSION_TEXT_LIST[index].replace(
          '(指定曲)',
          idolState.idol.music,
        )}\n`;
      } else {
        text2 += `・${MISSION_TEXT_LIST[index]}\n`;
      }
    });
    window.alert(text1 + text2);
  };

  // ミッションの全体的な達成数を表示
  if (!(missionName in MISSION_TEXT_TO_INDEX)) {
    const missionCount = idolState.missionFlg.filter(flg => flg).length;

    return (
      <>
        <span className="mr-3 mt-1">{missionCount}</span>
        <Button size="sm" onClick={showMissionStatus}>
          詳細
        </Button>
      </>
    );
  }

  // 指定したミッションについての情報
  if (idolState.missionFlg[MISSION_TEXT_TO_INDEX[missionName]]) {
    // 達成時はその旨と、達成を取り消すボタンを表示する
    return (
      <>
        <span className="mr-3 mt-1">達成</span>
        <Button variant="warning" size="sm" onClick={changeMissionState}>
          未達成にする
        </Button>
      </>
    );
  }
  // 未達成時は達成条件と、達成したことを知らせるボタンを表示する
  if (missionName.includes('指定曲')) {
    return (
      <>
        <span className="mr-3 mt-1">{`未達成(${idolState.idol.music})`}</span>
        <Button variant="secondary" size="sm" onClick={changeMissionState}>
          達成にする
        </Button>
      </>
    );
  }

  return (
    <>
      <span className="mr-3 mt-1">未達成</span>
      <Button variant="secondary" size="sm" onClick={changeMissionState}>
        達成にする
      </Button>
    </>
  );
};

// アイドル単体のComponent
const IdolRow: React.FC<{ idolState: IdolState }> = ({ idolState }) => {
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
        <span className="font-weight-bold mr-3 mt-1">
          {idolState.idol.name}
        </span>
        <IdolMissionStatus idolState={idolState} />
      </div>
    </ListGroup.Item>
  );
};

// アイドル一覧のComponent
const IdolView: React.FC = () => {
  const { filteredIdolStateList } = useContext(StateContext);

  if (filteredIdolStateList.length > 0) {
    return (
      <ListGroup>
        {filteredIdolStateList.map((idolState: IdolState) => (
          <IdolRow key={idolState.idol.id} idolState={idolState} />
        ))}
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
