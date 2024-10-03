import { useContext, useEffect, useState } from "react";
import Layout from "../Layout";
import { Box } from "@mui/material";
import GeneralGroceries from "./GeneralGroceries";
import PersonalGroceries from "./PersonalGroceries";
import UserContext from "../../contextes/UserContext";

export default function Groceries() {
  const { user } = useContext(UserContext);

  return (
    <Layout>
      <Box sx={{ display: 'flex', width: '100%', gap: '32px', flexWrap: 'wrap' }}>
        {
          !user.isAdmin &&
          <PersonalGroceries />
        }
        <GeneralGroceries />
      </Box>
    </Layout>
  )
}