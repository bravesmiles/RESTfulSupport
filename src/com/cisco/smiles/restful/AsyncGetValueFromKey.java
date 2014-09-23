package com.cisco.smiles.restful;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebInitParam;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;

import com.cisco.smiles.utils.JSONUtil;
import com.cisco.todolist.model.TodoAction;
import com.cisco.todolist.model.TodoListManager;

/**
 * Servlet implementation class AsyncGetValueFromKey
 */
@WebServlet(asyncSupported = true, urlPatterns = { "/AsyncGetValueFromKey" }, initParams = {
		@WebInitParam(name = "hello", value = "kitty", description = "Just for test."),
		@WebInitParam(name = "trustedURLs", value = "http://localhost:63342", description = "Trusted URLs.") })
public class AsyncGetValueFromKey extends HttpServlet {

	private static final long serialVersionUID = 1L;

	// private static HashMap<String, String> initValues = new HashMap<>();

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public AsyncGetValueFromKey() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see Servlet#init(ServletConfig)
	 */
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		// TODO Auto-generated method stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * javax.servlet.http.HttpServlet#doGet(javax.servlet.http.HttpServletRequest
	 * , javax.servlet.http.HttpServletResponse)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		String key = request.getParameter("key");
		response.setContentType("text/javascript");
		String callback = request.getParameter(JSONUtil.CALLBACK);
		String result;

		if (StringUtils.isBlank(key)) {
			return;
		}

		switch (key) {
		case TodoAction.GET_ALL:
			syncTodoList(response, callback);
			break;
		case TodoAction.CLEAR_ALL:
			TodoListManager.getInstance().clearList();
			syncTodoList(response, callback);
			break;
		default:
			String value = getServletConfig().getInitParameter(key);
			if (value == null) {
				value = key;
			}

			JSONObject resultJSON = new JSONObject();
			resultJSON.put(key, value);
			JSONUtil.addVersionToJSON(resultJSON);

			result = resultJSON.toString();

			if (StringUtils.isBlank(callback)) {
				response.getWriter().write(result);
				return;
			}
			result = JSONUtil.getJSONResult(resultJSON, callback);
			response.getWriter().write(result);
		}
	}

	/**
	 * @param response
	 * @param callback
	 * @throws IOException
	 */
	private void syncTodoList(HttpServletResponse response, String callback)
			throws IOException {
		String result;
		String[] todoList = TodoListManager.getInstance().getTodoList();
		JSONObject json = new JSONObject();
		json.put("value", todoList);
		result = json.toString();

		if (StringUtils.isBlank(callback)) {
			response.getWriter().write(result);
			return;
		}
		result = JSONUtil.getJSONResult(json, callback);
		response.getWriter().write(result);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub

		// Get client's origin
		String clientOrigin = request.getHeader("origin");
		String trustedURLsStr = getServletConfig().getInitParameter(
				"trustedURLs");
		List<String> trustedURLsArray = Arrays
				.asList(trustedURLsStr.split(","));

		if (trustedURLsArray.indexOf(clientOrigin) != -1) {
			JSONUtil.enableCrossDomain(clientOrigin, response);
		}

		String key = request.getParameter("key");
		String value = request.getParameter("value");

		if (StringUtils.isBlank(key) || StringUtils.isBlank(value)) {
			return;
		}

		switch (key) {
		case TodoAction.REMOVE_ITEM:
			TodoListManager.getInstance().removeItem(value);
			break;
		case TodoAction.ADD_ITEM:
			TodoListManager.getInstance().addItem(value);
			break;
		}

	}

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		super.doDelete(req, resp);
	}

	@Override
	protected void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		super.doPut(req, resp);
	}

}
