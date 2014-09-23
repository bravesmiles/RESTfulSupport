/**
 * 
 */
package com.cisco.todolist.model;

import java.util.ArrayList;
import java.util.List;

/**
 * @author yaojliu
 *
 */
public class TodoActionManager {
	
	private static List<TodoAction> todoActionList = new ArrayList<>();
	private static TodoActionManager instance = new TodoActionManager();

	private TodoActionManager() {
		super();
		// TODO Auto-generated constructor stub
	}
	
	public TodoActionManager getInstance(){
		return instance;
	}
	
	public void addTodoAction(TodoAction action){
		todoActionList.add(action);
	}
	
//	public TodoAction getTodoAction(){
//	}

}
