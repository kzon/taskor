import React, {Component} from 'react';
import Helpers from './Helpers';
import Task from './Task';
import AddTask from "./AddTask";

export default class TasksList extends Component {
    constructor() {
        super();
        this.state = {
            tasks: [],
            loaded: false,
            progress: null,
        };
        this.handleAddTask = this.handleAddTask.bind(this);
        this.handleEditTask = this.handleEditTask.bind(this);
        this.handleDeleteTask = this.handleDeleteTask.bind(this);
        this.handleDoneTask = this.handleDoneTask.bind(this);
        this.handleNotDoneTask = this.handleNotDoneTask.bind(this);
        this.handleArchiveTask = this.handleArchiveTask.bind(this);
        this.handleTimerStart = this.handleTimerStart.bind(this);
    }

    componentDidMount() {
        let date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0);
        const filter = {
            where: {
                // createdAt: {"gte": date.toISOString()},
                archive: false
            },
            order: "done",
        };
        fetch('/api/tasks/?filter=' + JSON.stringify(filter))
            .then(response => {
                if (response.ok)
                    return response.json();
                throw new Error('Can not load tasks, status: ' + response.status);
            })
            .then(data => {
                this.setState({
                    tasks: data,
                    loaded: true,
                });
            })
            .catch(error => {
                this.setState({
                    error: error,
                    loaded: true,
                });
            });
    }

    // Update and delete helpers
    updateTask(task) {
        return fetch('/api/tasks/' + task.id, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(task)
        })
            .then((response) => {
                return response.json();
            })
            .then((task) => {
                this.updateTaskInList(task);
            });
    }

    updateTaskInList(task) {
        this.setState((prevState) => {
            prevState.tasks = prevState.tasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask));
            return prevState;
        });
    }

    removeTaskFromList(task) {
        let array = this.state.tasks.filter(function(item) {
            return item !== task
        });
        this.setState({tasks: array});
    }

    handleAddTask(task) {
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(task)
        })
            .then(response => {
                return response.json();
            })
            .then(data => {
                this.setState((prevState) => ({
                    tasks: prevState.tasks.concat(data)
                }));
            });
    }

    handleEditTask(task) {
        this.updateTask(task);
    }

    handleDeleteTask(task) {
        fetch('/api/tasks/' + task.id,
            {method: 'delete'})
            .then(() => {
                this.removeTaskFromList(task);
            });
    }

    handleDoneTask(task) {
        task.done = 1;
        this.updateTask(task);
    }

    handleNotDoneTask(task) {
        task.done = 0;
        this.updateTask(task);
    }

    handleArchiveTask(task) {
        task.archive = 1;
        this.updateTask(task);
        this.removeTaskFromList(task);
    }

    handleTimerStart(task) {
        const progress = {timerSeconds: task.actualTime * 3600, timerId: 0, task: task, paused: false};
        progress.timerId = setInterval(() => {
            if (!this.state.progress.paused) {
                this.setState((prevState) => {
                    let progress = prevState.progress;
                    progress.timerSeconds++;
                    return {progress};
                }, () => {
                    if (this.state.progress.timerSeconds % 300 == 0) {
                        // Sync with server
                        this.updateTask({
                            id: this.state.progress.task.id,
                            actualTime: Math.round(this.state.progress.timerSeconds / 3600 * 10) / 10,
                        });
                    }
                });
            }
        }, 1000);
        this.setState({progress});
    }

    // Render
    renderTasks() {
        let content;

        if (this.state.loaded) {
            if (this.state.error) {
                content = <div className='alert alert-danger'>{this.state.error.message}</div>;
            }
            else {
                content = this.state.tasks.map(task =>
                    <Task task={task} key={task.id} onEdit={this.handleEditTask} onDelete={this.handleDeleteTask}
                          onDone={this.handleDoneTask} onNotDone={this.handleNotDoneTask}
                          onArchive={this.handleArchiveTask} onTimerStart={this.handleTimerStart}/>);
            }
        }
        else {
            content = <div className='alert alert-info loading'>Загрузка списка задач...</div>;
        }

        return (
            <div className="list-group">
                {content}
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.state.progress != null &&
                <div className="row timer">
                    <div className="col">
                        <div className="timer-container">
                            <div className={"timer" + (this.state.progress.paused ? " paused" : '')}>
                                <span className="text">В работе: </span>
                                <span className="task-name">{this.state.progress.task.name} </span>
                                <i className="far fa-clock icon"/>
                                <span className="time">{Helpers.secondsToHms(this.state.progress.timerSeconds)}</span>
                                <span className="timer-pause-button"
                                      onClick={() => {
                                          this.setState((prevState) => {
                                              prevState.progress.paused = !prevState.progress.paused;
                                              return prevState;
                                          })
                                      }}>
                                    <i className="fas fa-pause icon"/>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>}
                <div className="row task-list">
                    <div className="col">
                        {this.renderTasks()}
                    </div>
                </div>
                <div className="row float-right">
                    <div className="col">
                        <AddTask onAdd={this.handleAddTask}/>
                    </div>
                </div>
            </div>
        );
    }
}
