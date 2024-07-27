import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getCombinedData = async (month, page = 1, perPage = 10, search = '') => {
  const response = await axios.get(`${API_URL}/combined-data`, {
    params: { month, page, perPage, search }
  });
  console.log("Response call man",response);
  return response.data;
};
