/**
 * 
 */
package com.cisco.todolist.model;

/**
 * @author yaojliu
 *
 */
public class TodoAction {
	
	public static final String ADD_ITEM = "addTodoItem";
	public static final String REMOVE_ITEM = "removeTodoItem";
	public static final String CLEAR_ALL = "clearTodoList";
	public static final String GET_ALL = "getAll";

	private String method;
	private String value;
	private String version;
	
	public TodoAction(String method, String value) {
		super();
		this.setMethod(method);
		this.setValue(value);
	}

	/**
	 * @return the value
	 */
	public String getValue() {
		return value;
	}

	/**
	 * @param value the value to set
	 */
	public void setValue(String value) {
		this.value = value;
	}

	/**
	 * @return the method
	 */
	public String getMethod() {
		return method;
	}

	/**
	 * @param method the method to set
	 */
	public void setMethod(String method) {
		this.method = method;
	}

	/**
	 * @return the version
	 */
	public String getVersion() {
		return version;
	}

	/**
	 * @param version the version to set
	 */
	public void setVersion(String version) {
		this.version = version;
	}
	
}
