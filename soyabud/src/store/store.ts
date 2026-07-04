import { getInstance, soya } from '@/services';
import { SoyaDocument } from 'soya-js';
import { MultiResponse, Paging, SemconItem, SemconMeta, SemconMinMeta, SemconPostItem, SemconRepo, SemconSchema } from 'semcon-js';
import Vue from 'vue';
import Vuex, { Commit } from 'vuex'
import { ActionType } from './action-type';
import { FetchState } from './fetch-state';
import { MutationType } from './mutation-type';

export interface IFetchVaultItems {
  page?: number;
  size?: number;
  repo?: SemconRepo;
  schema?: Partial<SemconSchema>;
  fetchContent?: boolean;
}

// These special types are currently due to a legacy
// implementation, but could be helpful in future
// if we want to extend the base semcon-js types
type SoyaVaultMeta = SemconMeta & {
  // id: number | string;
};

type SoyaVaultMinMeta = SemconMinMeta & {
  // id: number | string;
  dri: string;
};

type SoyaVaultItem = SemconItem & {
  // id: number | string;
  author?: string;
  organization?: string;
};

export enum Language {
  JSON_LD = 'json-ld',
  YAML = 'yaml',
}

export interface IStore {
  repo: {
    all?: SemconRepo[],
    state: FetchState,
  },
  schemaDRI: {
    all: SemconSchema[],
    state: FetchState,
    current?: SoyaDocument,
  },
  vaultItem: {
    all: SoyaVaultMeta[],
    allState: FetchState,
    current?: SemconItem,
    currentState: FetchState,
    paging?: Paging,
    language: string,
  },
  ui: {
    isFluid: boolean,
  }
}
interface IFetchState {
  state: FetchState,
  setFetchState: (store: IStore, state: FetchState) => void,
}

async function doFetch<T>(
  commit: Commit,
  asyncFunc: () => Promise<T>,
  setState: (commit: Commit, data: T) => void,
  setFetchState: (store: IStore, state: FetchState) => void,
) {
  const commitObj: IFetchState = {
    setFetchState,
    state: FetchState.FETCHING,
  }

  commit(MutationType.SET_FETCH_STATE, commitObj);
  try {
    setState(commit, await asyncFunc());

    commitObj.state = FetchState.SUCCESS;
    commit(MutationType.SET_FETCH_STATE, commitObj)
  }
  catch (e) {
    console.error(e);

    commitObj.state = FetchState.ERROR;
    commit(MutationType.SET_FETCH_STATE, commitObj);
  }
}

export const getStore = () => {
  Vue.use(Vuex);

  return new Vuex.Store({
    state: (): IStore => ({
      repo: {
        all: [],
        state: FetchState.NONE,
      },
      schemaDRI: {
        all: [],
        state: FetchState.NONE,
        current: undefined,
      },
      vaultItem: {
        all: [],
        allState: FetchState.NONE,
        current: undefined,
        currentState: FetchState.NONE,
        paging: undefined,
        language: Language.YAML,
      },
      ui: {
        isFluid: false,
      }
    }),
    mutations: {
      [MutationType.SET_FETCH_STATE](state, payload: IFetchState) {
        payload.setFetchState(state, payload.state);
      },
      [MutationType.SET_REPOS](state, payload: SemconRepo[]) {
        state.repo.all = payload;
      },
      [MutationType.SET_CURRENT_SCHEMA](state, payload: SoyaDocument | undefined) {
        state.schemaDRI.current = payload;
      },
      [MutationType.SET_SCHEMA_DRIS](state, payload: SemconSchema[]) {
        state.schemaDRI.all = payload;
      },
      [MutationType.SET_VAULT_ITEMS](state, payload: SemconMeta[]) {
        state.vaultItem.all = payload;
      },
      [MutationType.SET_VAULT_ITEM](state, payload: SemconItem) {
        state.vaultItem.current = payload;
      },
      [MutationType.SET_VAULT_ITEM_LANGUAGE](state, payload: string) {
        state.vaultItem.language = payload;
      },
      [MutationType.SET_SCHEMA_DRI_TITLE](state, payload: SemconSchema) {
        const item = state.schemaDRI.all.find(x => x.dri === payload.dri);

        if (item)
          item.title = payload.title;
      },
      [MutationType.SET_VAULT_ITEMS_PAGING](state, payload?: Paging) {
        state.vaultItem.paging = payload;
      },
      [MutationType.SET_UI_IS_FLUID](state, payload: boolean) {
        state.ui.isFluid = payload;
      },
    },
    actions: {
      [ActionType.RESET_VAULT_ITEMS]({ commit }) {
        commit(MutationType.SET_VAULT_ITEMS, undefined);
        commit(MutationType.SET_VAULT_ITEM, undefined);
        commit(MutationType.SET_VAULT_ITEMS_PAGING, undefined);
      },
      async [ActionType.UPDATE_VAULT_ITEM]({ state }, payload: SemconPostItem) {
        let jsonld: SoyaDocument | undefined = undefined;
        let yaml: string | undefined = undefined;

        if (state.vaultItem.language === Language.YAML) {
          yaml = payload.data as string;
          jsonld = await soya.init(yaml);
        }
        else {
          jsonld = payload.data;
        }

        await soya.push(jsonld, {
          soya_yaml: yaml,
          meta: payload.meta,
        });
      },
      async [ActionType.DELETE_VAULT_ITEM]({ state, commit }, payload: SemconMeta) {
        if (payload.dri)
          await soya.delete(payload.dri);
        else
          throw new Error('Delete needs payload to have a DRI');

        if (state.vaultItem.current?.id === payload.id)
          commit(MutationType.SET_VAULT_ITEM, undefined);
      },
      async [ActionType.FETCH_SCHEMA_DRIS]({ commit, dispatch }) {
        await doFetch<SemconSchema[]>(
          commit,
          async () => (await soya.query()).map<SemconSchema>(x => ({
            // yep, this is correct
            // the name is our unique identifier
            dri: x.name,
            title: x.name,
          })),
          (commit, data) => {
            dispatch(ActionType.RESET_VAULT_ITEMS);
            commit(MutationType.SET_SCHEMA_DRIS, data);
            dispatch(ActionType.FETCH_SCHEMAS_TITLE);
          },
          (store, state) => store.schemaDRI.state = state
        );
      },
      async [ActionType.FETCH_REPOS]({ commit, dispatch }) {
        await doFetch<SemconRepo[] | undefined>(
          commit,
          async () => {
            // semcon-js does not expose getRepos anymore,
            // hence we replicate the former behavior here
            const semcon = getInstance();
            if (!(await semcon.getSemconSupport()).repos)
              return undefined;

            const { data } = await semcon.get('/api/repos/index', 'optional');
            return data as SemconRepo[];
          },
          (commit, data) => {
            dispatch(ActionType.RESET_VAULT_ITEMS);
            commit(MutationType.SET_REPOS, data);
          },
          (store, state) => store.repo.state = state
        );
      },
      async [ActionType.FETCH_VAULT_ITEMS]({ commit, state }, { schema }: IFetchVaultItems) {
        // reset currently selected vault item if list of vault items is refreshed
        commit(MutationType.SET_VAULT_ITEM, undefined);
        commit(MutationType.SET_CURRENT_SCHEMA, undefined);

        await doFetch<MultiResponse<SoyaVaultMeta>>(
          commit,
          async () => {
            const schemaPath = schema?.title ?? schema?.dri;
            if (schemaPath) {
              // TODO: needs paging mechanism
              const res = await soya.info(schemaPath);
              const items = res.history
                .filter(x => {
                  if (state.vaultItem.language === Language.YAML)
                    return x.yaml;

                  return true;
                })
                .map<SoyaVaultMeta>(x => {
                  const date = new Date(x.date);

                  return {
                    id: x.id,
                    dri: x.dri,
                    createdAt: date,
                    updatedAt: date,
                    meta: {},
                    raw: x,
                  };
                });

              return {
                items,
                paging: {
                  current: 1,
                  pageItems: items.length,
                  totalItems: items.length,
                  totalPages: 1,
                }
              };
            }
            else {
              throw new Error('Schema and repo are undefined');
            }
          },
          (commit, data) => {
            commit(MutationType.SET_VAULT_ITEMS, data.items);
            commit(MutationType.SET_VAULT_ITEMS_PAGING, data.paging);
          },
          (store, state) => store.vaultItem.allState = state,
        );
      },
      async [ActionType.FETCH_VAULT_ITEM]({ commit, state }, payload: SoyaVaultMinMeta) {
        await doFetch<SoyaVaultItem>(
          commit,
          async () => {
            // Important:
            // do not disable auth here. We want the RepoService defaultAuth
            // from the central SOyA instance to decide whether a bearer token
            // should be attached.
            const res = await soya.service.get(`/api/data?id=${payload.id}`);

            return {
              id: payload.id,
              dri: payload.dri,
              createdAt: res.created_at,
              updatedAt: res.updated_at,
              author: res.author,
              organization: res.organization,
              meta: res.meta,
              raw: res,
              data: state.vaultItem.language === Language.YAML ? res.soya_yaml : res.data,
            };
          },
          (commit, data) => commit(MutationType.SET_VAULT_ITEM, data),
          (store, state) => store.vaultItem.currentState = state,
        )
      },
      async [ActionType.SET_VAULT_ITEM_LANGUAGE]({ commit, state, dispatch }, payload: Language) {
        commit(MutationType.SET_VAULT_ITEM_LANGUAGE, payload);

        // refetch current vault item, if needed
        if (state.vaultItem.current)
          dispatch(ActionType.FETCH_VAULT_ITEM, state.vaultItem.current);
      },
      async [ActionType.FETCH_SCHEMAS_TITLE]({ commit, state }) {
        const infos = await soya.info(state.schemaDRI.all.map(x => x.dri));

        for (const info of infos) {
          const schema = state.schemaDRI.all.find(x => x.dri === info.dri);

          if (schema) {
            schema.title = info.name;
            commit(MutationType.SET_SCHEMA_DRI_TITLE, schema);
          }
        }
      },
      async [ActionType.TOGGLE_UI_IS_FLUID]({ commit, state }) {
        commit(MutationType.SET_UI_IS_FLUID, !state.ui.isFluid);
      },
    }
  });
}