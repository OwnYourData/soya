import MainView from '../views/MainView.vue';
import SchemaView from '../views/SchemaView.vue';
import ItemView from '../views/ItemView.vue';

export enum RoutePath {
  MAIN_VIEW = '/',
  SCHEMA_VIEW = '/schema',
  ITEM_VIEW = '/item',
}

export enum RouteParams {
  SCHEMA_DRI = 'schemaDri',
  ITEM_ID = 'itemId',
}

export const routes = [
  {
    path: RoutePath.MAIN_VIEW,
    component: MainView
  },
  {
    path: RoutePath.SCHEMA_VIEW,
    component: SchemaView,
    props: () => {
      return { schemaDri: new URL(window.location.href).searchParams.get(RouteParams.SCHEMA_DRI) }
    },
  },
  {
    path: RoutePath.ITEM_VIEW,
    component: ItemView,
    props: () => {
      return { itemId: new URL(window.location.href).searchParams.get(RouteParams.ITEM_ID) }
    },
  },
];