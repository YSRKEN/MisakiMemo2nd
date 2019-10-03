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
  | 'setSortType'
  | 'setHiddenCompletedIdolFlg'
  | 'setDumpData'
  | 'loadDumpData'
  | 'saveDumpData';

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

const MISSION_COUNT = MISSION_TEXT_LIST.length;

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
  hiddenCompletedIdolFlg: boolean;
  dumpSaveData: string;
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

// 進捗状況を保存する
const saveMissionFlg = (idolStateList: IdolState[]) => {
  // 10項目×52=520フラグ分を一旦配列にストアする
  const bitStore: number[] = [];
  for (const idolState of idolStateList) {
    idolState.missionFlg.forEach(flg => bitStore.push(flg ? 1 : 0));
  }

  // ストアしたものを8bitづつ区切って表現する。520÷8＝65なので割り切れる
  const OCTET = 8;
  const byteStore: number[] = [];
  for (let i = 0; i < bitStore.length; i += OCTET) {
    byteStore.push(
      (bitStore[i] << 7) |
        (bitStore[i + 1] << 6) |
        (bitStore[i + 2] << 5) |
        (bitStore[i + 3] << 4) |
        (bitStore[i + 4] << 3) |
        (bitStore[i + 5] << 2) |
        (bitStore[i + 6] << 1) |
        bitStore[i + 7],
    );
  }

  // 区切ったものをBase64変換する
  const binStr = String.fromCharCode(...byteStore);
  const base64Word = btoa(binStr);

  // ローカルストレージに保存する
  window.localStorage.setItem('saveData', base64Word);
};

// 進捗状況を読み込む
const loadMissionFlg = () => {
  // ローカルストレージからデータを読み込む
  const base64Word = window.localStorage.getItem('saveData');
  if (base64Word === null) {
    return [];
  }

  // デコードする
  const binStr = atob(base64Word);
  const byteStore = binStr.split('').map(c => c.charCodeAt(0));
  const bitStore: boolean[] = [];
  for (const byteData of byteStore) {
    bitStore.push(((byteData >> 7) & 1) === 1);
    bitStore.push(((byteData >> 6) & 1) === 1);
    bitStore.push(((byteData >> 5) & 1) === 1);
    bitStore.push(((byteData >> 4) & 1) === 1);
    bitStore.push(((byteData >> 3) & 1) === 1);
    bitStore.push(((byteData >> 2) & 1) === 1);
    bitStore.push(((byteData >> 1) & 1) === 1);
    bitStore.push(((byteData >> 0) & 1) === 1);
  }

  const missionFlgs: boolean[][] = [];
  for (let i = 0; i < bitStore.length; i += MISSION_COUNT) {
    missionFlgs.push(bitStore.slice(i, i + MISSION_COUNT));
  }

  return missionFlgs;
};

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
  // ミッションを全て終わらせたアイドルを非表示にするか？
  const [hiddenCompletedIdolFlg, setHiddenCompletedIdolFlg] = useState(false);
  // ダンプした進捗状況
  const [dumpSaveData, setDumpSaveData] = useState('');
  // アイドルのデータ一覧
  const [idolStateList, setIdolStateList] = useState<IdolState[]>([]);
  // 表示するアイドルの一覧
  const [filteredIdolStateList, setFilteredIdolStateList] = useState<
    IdolState[]
  >([]);
  const [initializeFlg, setInitializeFlg] = useState(false);

  // 状態の初期化
  useEffect(() => {
    fetch('./idol_list.json').then((res: Response) => {
      res.json().then((dataList: IdolData[]) => {
        const missionFlgs = loadMissionFlg();
        if (missionFlgs.length === 0) {
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
        } else {
          setIdolStateList(
            dataList.map((data: IdolData, index: number) => {
              return {
                idol: data,
                missionFlg: missionFlgs[index],
              } as IdolState;
            }),
          );
        }
        setInitializeFlg(true);
      });
    });
  }, []);

  // 表示するアイドルの一覧を更新
  useEffect(() => {
    let newIdolStateList: IdolState[] = [];

    // 表示するアイドルを制限
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
    if (hiddenCompletedIdolFlg) {
      newIdolStateList = newIdolStateList.filter(record => {
        const count = record.missionFlg.filter(flg => flg).length;

        return count !== MISSION_COUNT;
      });
    }

    // 指定した順にソート
    switch (sortType) {
      case 'IdolId':
        // アイドルID順
        newIdolStateList = newIdolStateList.sort(
          (a, b) => a.idol.id - b.idol.id,
        );
        break;
      case 'MissionAsc': {
        // ミッションの未達成順
        if (missionName === MISSION_TEXT_LIST2[0]) {
          // 達成数を数えてソート
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg.filter(flg => flg).length;
            const bCount = b.missionFlg.filter(flg => flg).length;

            return aCount - bCount;
          });
        } else {
          // 達成していないものを上に
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
        // ミッションの達成順
        if (missionName === MISSION_TEXT_LIST2[0]) {
          // 達成数を数えてソート
          newIdolStateList = newIdolStateList.sort((a, b) => {
            const aCount = a.missionFlg.filter(flg => flg).length;
            const bCount = b.missionFlg.filter(flg => flg).length;

            return bCount - aCount;
          });
        } else {
          // 達成しているものを上に
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
  }, [
    idolName,
    idolType,
    sortType,
    hiddenCompletedIdolFlg,
    idolStateList,
    missionName,
  ]);

  // 設定を保存
  useEffect(() => {
    if (initializeFlg) {
      saveMissionFlg(idolStateList);
    }
  }, [idolStateList, initializeFlg]);

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
        // 誰のどのミッションについての変更かを読み取る
        const [selectedIdolName, selectedMissionName] = action.message.split(
          ',',
        );

        // アイドル・ミッションそれぞれのインデックスを算出
        const idolIndex = idolStateList.findIndex(
          state => state.idol.name === selectedIdolName,
        );
        const missionIndex = MISSION_TEXT_TO_INDEX[selectedMissionName];

        // 書き換えたものを再度上書きする
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
      case 'setHiddenCompletedIdolFlg':
        setHiddenCompletedIdolFlg(action.message === 'True');
        break;
      case 'setDumpData':
        setDumpSaveData(action.message);
        break;
      case 'loadDumpData': {
        window.localStorage.setItem('saveData', dumpSaveData);
        const missionFlgs = loadMissionFlg();
        if (missionFlgs.length !== 0) {
          setIdolStateList(
            idolStateList.map((data: IdolState, index: number) => {
              return {
                idol: data.idol,
                missionFlg: missionFlgs[index],
              } as IdolState;
            }),
          );
        }
        setDumpSaveData('');
        break;
      }
      case 'saveDumpData': {
        const saveData = window.localStorage.getItem('saveData');
        if (saveData !== null) {
          setDumpSaveData(saveData);
        }
        break;
      }
      default:
        break;
    }
  };

  return {
    idolName,
    idolType,
    missionName,
    sortType,
    hiddenCompletedIdolFlg,
    dumpSaveData,
    filteredIdolStateList,
    dispatch,
  };
};

// 検索フォームのComponent
const SearchForm: React.FC = () => {
  const {
    idolName,
    idolType,
    missionName,
    sortType,
    hiddenCompletedIdolFlg,
    dumpSaveData,
    dispatch,
  } = useContext(StateContext);

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

  const onChangeHiddenCompletedIdolFlg = () => {
    dispatch({
      type: 'setHiddenCompletedIdolFlg',
      message: hiddenCompletedIdolFlg ? 'False' : 'True',
    } as Action);
  };

  const onChangeDumpData = (e: FormEvent<any>) =>
    dispatch({
      type: 'setDumpData',
      message: e.currentTarget.value,
    } as Action);

  const onClickSaveDumpData = () =>
    dispatch({
      type: 'saveDumpData',
      message: '',
    } as Action);

  const onClickLoadDumpData = () => {
    if (dumpSaveData === '') {
      return;
    }
    if (window.confirm('進捗状況を読み込んでよろしいですか？')) {
      dispatch({
        type: 'loadDumpData',
        message: '',
      } as Action);
    }
  };

  return (
    <Form className="border px-3 pt-3">
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
      <Form.Group controlId="Option">
        <Form.Check
          className="d-inline mr-3"
          type="checkbox"
          label="完遂者を非表示"
          checked={hiddenCompletedIdolFlg}
          onChange={onChangeHiddenCompletedIdolFlg}
        />
      </Form.Group>
      <Form.Group controlId="Misc" className="text-center">
        <Form.Control
          className="d-inline mr-3 w-auto mb-2"
          placeholder="進捗(Base64)"
          value={dumpSaveData}
          onChange={onChangeDumpData}
        />
        <Button size="sm" className="mr-3" onClick={onClickSaveDumpData}>
          進捗を出力
        </Button>
        <Button size="sm" variant="warning" onClick={onClickLoadDumpData}>
          進捗を入力
        </Button>
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
          <Col className="m-3 text-center">
            <h1>美咲メモ 2nd</h1>
            <span className="mr-3">Ver.1.0.0</span>
            <span className="mr-3">
              <a href="https://twitter.com/YSRKEN">作者Twitter</a>
            </span>
            <span className="mr-3">
              <a href="https://github.com/YSRKEN/MisakiMemo2nd">GitHub</a>
            </span>
            <span>
              <a href="https://github.com/YSRKEN/MisakiMemo2nd/blob/master/README.md">
                取説
              </a>
            </span>
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
