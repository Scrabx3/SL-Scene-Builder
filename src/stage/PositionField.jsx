import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Col, Input, Row, Select, Space } from "antd";
import { raceKeys } from "../common/RaceKeys";


const PositionField = forwardRef(function PositionField({ position }, ref) {
  const [event, setEvent] = useState(position.event);
  const [race, setRace] = useState(position.race);

  useImperativeHandle(ref, () => {
    return {
      getData() {
        
      }
    };
  }, [event, race]);

  return (
    <div>
      <Row>
        <Col>
          <Space>
            <div className="position-race-text">Race:</div>
            <Select
              className='position-race-select'
              defaultValue={race}
              showSearch
              placeholder="Position race"
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              }
              options={raceKeys.map((race, i) => { return { value: race, label: race } })}
              onSelect={(e) => { setRace(e) }}
            />
          </Space>
        </Col>
        <Col flex={'auto'} >
          <Input className="position-behavior-input" addonAfter={'.hkx'}
            value={event} onChange={(e) => { setEvent(e.target.value) }}
            placeholder="Behavior file"
          />
        </Col>
      </Row>
    </div>
  );
});

export default PositionField;
