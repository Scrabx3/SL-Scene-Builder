import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown } from "antd";
import React from "react";

export function TagMenu({ tags, label, onClick }) {
  return (
    <Dropdown menu={{ items: tags.map((tag: String) => { return { label: tag, key: tag } }), onClick }}        >
      <a onClick={(e) => e.preventDefault()}>
        <Button>
          {label}
          <DownOutlined />
        </Button>
      </a>
    </Dropdown>
  )
}
