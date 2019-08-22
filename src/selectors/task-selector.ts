import {Selector} from "../common/selector"
import {TaskService} from "../services/task-service"

export const TaskSelector = new Selector([
    {name: 'id', field: '_id', readonly: true},
    {name: 'project', field: '_project', readonly: true},
    {name: 'module', field: '_module', readonly: true},
    {name: 'title', required: true, writeAs: Selector.notBlank},
    'description',
    {name: 'list', writeAs: TaskService.writeTaskList, onlyOnDetail: true},
    {name: 'statistics', readonly: true},
    {name: 'deadline', default: null, nullable: true},
    {name: 'archived', default: false},
    {name: 'createTime', readonly: true},
    {name: 'updateTime', readonly: true}
])

export const ProjectTaskSelector = new Selector([
    {name: 'id', field: '_id', readonly: true},
    {name: 'project', field: '_project', readonly: true},
    {name: 'module', field: '_module', readonly: true},
    {name: 'title', required: true, writeAs: Selector.notBlank},
    'description',
    {name: 'list', writeAs: TaskService.writeTaskList, onlyOnDetail: true},
    {name: 'statistics', readonly: true},
    {name: 'deadline', default: null, nullable: true},
    {name: 'archived', default: false},
    {name: 'createTime', readonly: true},
    {name: 'updateTime', readonly: true}
])

export const TaskTodoSelector = new Selector([
    {name: 'type'},
    {name: 'content'},
    {name: 'complete', default: false},
    {name: 'remark', default: null, nullable: true},
    {name: 'deadline', default: null, nullable: true}
])
export const TaskThinkSelector = new Selector([
    {name: 'type'},
    {name: 'content'},
    {name: 'remark', default: null, nullable: true},
    {name: 'deadline', default: null, nullable: true}
])
export const TaskNoteSelector = new Selector([
    {name: 'type'},
    {name: 'content'}
])
export const TaskListSelector = {
    todo: TaskTodoSelector,
    think: TaskThinkSelector,
    note: TaskNoteSelector
}