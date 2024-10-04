import { useEffect, useState } from "react";
import Layout from "../Layout";
import axios from "axios";
import { Typography } from "@mui/material";

export default function Meals() {

  const [meals, setMeals] = useState([])
  const [selectedDiet, setSelectedDiet] = useState(null)

  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    getMeals()
  }, [search, offset, limit])

  useEffect(() => {
    axios.get('/diets/selected')
      .then(({ data }) => {
        if (data) {
          setSelectedDiet(data)
        }
      })
      .catch(err => console.log(err))
  }, [])

  const getEatenStats = () => {

  }

  const getMeals = () => {
    let requestNum = 0
    return (() => {
      requestNum++;
      const currentNum = requestNum;
      return axios.get('/meals', {
        params: { limit, offset, name: search }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setTotal(data.total)
          setMeals(data.meals)
        })
        .catch((error) => {
          console.log(error)
        })
    })()
  }

  return (
    <Layout>
      {
        selectedDiet
        ? <Typography sx={{  }}>
            Выбранный рацион питания: { selectedDiet.name }
          </Typography>
        : <Typography sx={{  }}>
            Вы не выбрали рацион питания
          </Typography>
      }
    </Layout>
  )
}