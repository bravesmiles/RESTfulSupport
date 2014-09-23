/**
 * 
 */
package com.cisco.todolist.model;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.cisco.smiles.utils.JSONUtil;

/**
 * @author yaojliu
 *
 */
public class TodoListManager {
	
	private static TodoListManager instance = new TodoListManager();
	private static List<String> todoList = new ArrayList<>();
	private static final String[] initValues = {"breakfast", "lunch", "dinner"};
	private boolean init = false;

	/**
	 * 
	 */
	private TodoListManager() {
		// TODO Auto-generated constructor stub
		super();
	}
	
	public static TodoListManager getInstance(){
		return instance;
	}
	
	public String[] getTodoList(){
		if(init){
			todoList = Arrays.asList(initValues);
			JSONUtil.incrementVersion();
			init = false;
		}
		return todoList.toArray(new String[0]);
	}
	
	public void addItem(String item){
		todoList.add(item);
		JSONUtil.incrementVersion();
	}
	
	public void removeItem(String item){
		todoList.remove(item);
		JSONUtil.incrementVersion();
	}
	
	public void clearList(){
		todoList.clear();
		JSONUtil.incrementVersion();
	}

}
