import {Selector} from "../common/selector"

export const NoteSelector = new Selector([
    {name: 'id', field: '_id', readonly: true},
    {name: 'project', field: '_project', readonly: true},
    {name: 'module', field: '_module', readonly: true},
    {name: 'title', required: true, writeAs: Selector.notBlank},
    'content',
    {name: 'createTime', readonly: true},
    {name: 'updateTime', readonly: true}
])

export const ProjectNoteSelector = new Selector([
    {name: 'id', field: '_id', readonly: true},
    {name: 'project', field: '_project', readonly: true},
    {name: 'module', field: '_module', readonly: true},
    {name: 'title', required: true, writeAs: Selector.notBlank},
    'content',
    {name: 'createTime', readonly: true},
    {name: 'updateTime', readonly: true}
])