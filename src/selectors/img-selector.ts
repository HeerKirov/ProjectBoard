import {Selector} from "../common/selector"


export const ImgSelector = new Selector([
    {name: 'id', field: '_id', readonly: true},
    {name: 'project', field: '_project', readonly: true},
    {name: 'type', readonly: true},
    {name: 'uploadTime', readonly: true},
])