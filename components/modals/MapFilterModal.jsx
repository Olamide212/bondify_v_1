const FilterModal = ({ visible, filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ padding: 20 }}>
        <Text>Gender</Text>
        <Picker
          selectedValue={localFilters.gender}
          onValueChange={(value) =>
            setLocalFilters({ ...localFilters, gender: value })
          }
        >
          <Picker.Item label="Any" value="any" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>

        <Text>
          Age Range: {localFilters.ageRange[0]} - {localFilters.ageRange[1]}
        </Text>
        <Slider
          minValue={18}
          maxValue={100}
          values={localFilters.ageRange}
          onValuesChange={(values) =>
            setLocalFilters({ ...localFilters, ageRange: values })
          }
        />

        <Text>Distance: {localFilters.distance}km</Text>
        <Slider
          minValue={1}
          maxValue={100}
          values={[localFilters.distance]}
          onValuesChange={(values) =>
            setLocalFilters({ ...localFilters, distance: values[0] })
          }
        />

        <Button title="Apply" onPress={() => onApply(localFilters)} />
        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
};
