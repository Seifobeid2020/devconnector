import { Remove_ALERT, SET_ALERT } from "./types";
import { v4 as uuidv4 } from "uuid";
export const setAlert = (msg, alertType, timeCalls = 3000) => dispatch => {
	const id = uuidv4();
	dispatch({
		type: SET_ALERT,
		payload: { msg, alertType, id }
	});

	setTimeout(
		() =>
			dispatch({
				type: Remove_ALERT,
				payload: id
			}),
		timeCalls
	);
};
