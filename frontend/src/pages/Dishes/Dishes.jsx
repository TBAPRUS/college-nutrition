import { Box } from "@mui/material";
import Layout from "../Layout";
import PersonalDishes from "./PersonalDishes";

export default function Dishes() {
  return (
    <Layout>
      <Box sx={{ display: 'flex', width: '100%', gap: '32px', flexWrap: 'wrap' }}>
        <PersonalDishes />
      </Box>
    </Layout>
  )
}