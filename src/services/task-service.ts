import {TaskNote, TaskThink, TaskTodo} from "../models/model"
import {TaskListSelector} from "../selectors/task-selector"

export class TaskService {
    static writeTaskList(list: any): (TaskTodo | TaskThink | TaskNote | string)[] | undefined {
        if(typeof list !== 'object') return undefined
        let ret = []
        for(let item of list) {
            let result = TaskService.writeTaskListItem(item)
            if(result === undefined) return undefined
            ret.push(result)
        }
        return ret
    }
    static statistic(list: (TaskTodo | TaskThink | TaskNote)[]): any {
        let ret = {
            todoNum: 0, todoComplete: 0,
            thinkNum: 0, thinkComplete: 0,
            noteNum: 0
        }
        for(let item of list) {
            if(item.type === 'todo') {
                ret.todoNum += 1
                if(item.complete) ret.todoComplete += 1
            }else if(item.type === 'think') {
                ret.thinkNum += 1
                if(item.remark != null) ret.thinkComplete += 1
            }else{
                ret.noteNum += 1
            }
        }
        return ret
    }

    static writeTaskListItem(item: any): TaskTodo | TaskThink | TaskNote | string | undefined {
        if(typeof item === 'string') {
            return item
        }else if(typeof item === 'object') {
            if (!(TaskListSelector[item['type']] !== undefined)) return undefined
            let result = TaskListSelector[item['type']].writeFields(item)
            if (result === undefined) return undefined
            return result
        }else{
            return undefined
        }
    }
    static equalType(itemA: any, itemB: any): boolean {
        if(itemA == null || itemB == null) return false
        if(typeof itemA === 'string' && typeof itemB === 'string') return true
        return itemA.type == itemB.type
    }
}