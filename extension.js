const vscode = require('vscode');

function activate(context) {

    // Timer functionality
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "Timer: Off";
    statusBarItem.show();

    let timer;
    let startTime;
    let endTime;

    let disposable = vscode.commands.registerCommand('extension.startTimer', async () => {

        const input = await vscode.window.showInputBox({
            prompt: "Enter time in minutes:",
            validateInput: (value) => {
                if (isNaN(Number(value)) || Number(value) <= 0) {
                    return 'Please enter a valid positive number.';
                }
                return null;
            }
        });

        if (!input) {
            return;
        }

        const duration = parseInt(input) * 60 * 1000;

        startTime = Date.now();
        endTime = startTime + duration;

        if (timer) {
            clearInterval(timer);
        }

        timer = setInterval(() => {
            const remaining = endTime - Date.now();

            if (remaining <= 0) {
                clearInterval(timer);
                statusBarItem.text = "Timer: Time's up!";
                vscode.window.showInformationMessage("Time for a break!");
                return;
            }

            const minutes = Math.floor((remaining / (1000 * 60)) % 60);
            const seconds = Math.floor((remaining / 1000) % 60);

            statusBarItem.text = `Timer: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);

        statusBarItem.command = 'extension.stopTimer';
    });

    let stopTimerCommand = vscode.commands.registerCommand('extension.stopTimer', () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
            statusBarItem.text = "Timer: Stopped";
            statusBarItem.command = undefined;
        }
    });

    context.subscriptions.push(disposable, stopTimerCommand, statusBarItem);

    // Todo List functionality
    const todoProvider = new TodoListProvider(context);
    vscode.window.registerTreeDataProvider('todoList', todoProvider);

    let addTodoCommand = vscode.commands.registerCommand('todoList.addTodo', async () => {
        const newTodo = await vscode.window.showInputBox({ prompt: "Enter new todo:" });
        if (newTodo) {
            todoProvider.addTodo(newTodo);
        }
    });

    let deleteTodoCommand = vscode.commands.registerCommand('todoList.deleteTodo', async () => {
        const itemNumber = await vscode.window.showInputBox({ prompt: "Enter todo number to delete:" });
        if (itemNumber) {
            todoProvider.deleteTodo(itemNumber);
        }
    });

    context.subscriptions.push(addTodoCommand, deleteTodoCommand);
}

class TodoListProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.context = context;
        this.todos = context.globalState.get('todos',);
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return this.todos.map((todo, index) => {
                return new vscode.TreeItem(`${index + 1}. ${todo}`, vscode.TreeItemCollapsibleState.None);
            });
        }
        return;
    }

    addTodo(todo) {
        this.todos.push(todo);
        this.saveTodos();
        this.refresh();
    }

    deleteTodo(itemNumber) {
        const indexToDelete = parseInt(itemNumber) - 1;
        if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < this.todos.length) {
            this.todos.splice(indexToDelete, 1);
            this.saveTodos();
            this.refresh();
        } else {
            vscode.window.showErrorMessage('Invalid todo number.');
        }
    }

    saveTodos() {
        this.context.globalState.update('todos', this.todos);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}