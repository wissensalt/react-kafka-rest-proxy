package com.wissensalt.backend;

import java.io.Serial;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class Payload implements Serializable {

  @Serial
  private static final long serialVersionUID = -1158673659463939843L;

  private String key;
  private String value;
}
