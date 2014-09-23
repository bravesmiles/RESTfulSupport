/**
 * 
 */
package com.cisco.smiles.utils;

import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

/**
 * @author yaojliu
 *
 */
public class JSONUtil {
	public static final String VERSION = "version";
	public static final String CALLBACK = "callback";

	private static AtomicInteger version = new AtomicInteger(0);

	public static int incrementVersion(){
		return version.incrementAndGet();
	}
	
	public static JSONObject addVersionToJSON(JSONObject json) {
		json.put(VERSION, version.get());
		return json;
	}

	/**
	 * @param response
	 * @param clientOrigin
	 */
	public static void enableCrossDomain(String clientOrigin,
			HttpServletResponse response) {
		// List of allowed origins
		response.setContentType("application/json");
		response.setHeader("Cache-control", "no-cache, no-store");
		response.setHeader("Pragma", "no-cache");
		response.setHeader("Expires", "-1");

		// if the client origin is found in our list then give access
		// if you don't want to check for origin and want to allow access
		// to all incoming request then change the line to this
		// response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Origin", clientOrigin);
		response.setHeader("Access-Control-Allow-Methods",
				"GET, POST, PUT,DELETE");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type");
		response.setHeader("Access-Control-Max-Age", "86400");
	}

	public static String getJSONResult(JSONObject json, String callback) {
		// TODO Auto-generated method stub
		addVersionToJSON(json);
		return getJSONResult(json.toString(), callback);
	}
	public static String getJSONResult(String json, String callback) {
		// TODO Auto-generated method stub
		StringBuilder sb = new StringBuilder();
		sb.append(callback + "(");
		sb.append(json + ");");
		return sb.toString();
	}
}
